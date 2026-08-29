const { getHaversineDistance } = require("./routeOptimizer");

/**
 * Formats minutes into human-friendly time string (e.g. 570 -> "09:30")
 */
const minutesToTimeString = (totalMinutes) => {
  const normalized = Math.max(0, Math.floor(totalMinutes)) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

/**
 * Parses time string (e.g. "09:30") into total minutes from midnight
 */
const timeStringToMinutes = (timeStr = "09:00") => {
  if (!timeStr) return 9 * 60;
  const parts = String(timeStr).split(":");
  const hours = parseInt(parts[0], 10) || 9;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
};

/**
 * Recalculates estimated arrivals, departure times, distances and durations for a day's stops
 */
const recalculateDaySchedule = (day, dayStartMinute = 9 * 60) => {
  let currentMinute = dayStartMinute;
  let totalDistanceKm = 0;
  let totalDurationMinutes = 0;

  const updatedStops = (day.stops || []).map((stop, idx, arr) => {
    let distanceFromPrevKm = 0;
    let travelTimeMinutes = 0;

    if (idx > 0) {
      const prev = arr[idx - 1];
      if (Number.isFinite(prev.lat) && Number.isFinite(prev.lon) && Number.isFinite(stop.lat) && Number.isFinite(stop.lon)) {
        const meters = getHaversineDistance(prev, stop);
        distanceFromPrevKm = Number((meters / 1000).toFixed(1));
        // Estimate driving speed: ~50 km/h in mixed traffic -> ~1.2 mins per km + 5 mins buffer
        travelTimeMinutes = Math.max(5, Math.round(distanceFromPrevKm * 1.2));
      } else {
        distanceFromPrevKm = 10;
        travelTimeMinutes = 15;
      }
    }

    currentMinute += travelTimeMinutes;
    const estimatedArrival = minutesToTimeString(currentMinute);

    const durationMinutes = Number(stop.durationMinutes) || 90; // Default 1.5 hour stay at stop
    currentMinute += durationMinutes;
    const departureTime = minutesToTimeString(currentMinute);

    totalDistanceKm += distanceFromPrevKm;
    totalDurationMinutes += travelTimeMinutes + durationMinutes;

    return {
      ...stop,
      id: stop.id || `stop-${Date.now()}-${idx}`,
      distanceFromPrevKm,
      estimatedArrival,
      departureTime,
      durationMinutes,
    };
  });

  return {
    ...day,
    stops: updatedStops,
    totalDistanceKm: Number(totalDistanceKm.toFixed(1)),
    totalDurationMinutes,
  };
};

/**
 * Generates default multi-day structure from planned trip data
 */
const buildInitialMultiDayItinerary = (start, destination, waypoints = [], places = []) => {
  // Determine number of days based on intermediate waypoints & places (1 to 3 days initial default)
  const totalStops = [
    ...(waypoints || []).map((w, idx) => ({
      id: `wp-${idx}-${Date.now()}`,
      name: w.name || `Waypoint ${idx + 1}`,
      lat: w.lat,
      lon: w.lon,
      category: "waypoint",
      durationMinutes: 120,
    })),
    ...(places || []).slice(0, 6).map((p, idx) => ({
      id: p.id || `poi-${idx}-${Date.now()}`,
      name: p.name,
      lat: p.lat,
      lon: p.lon,
      category: p.category || "attraction",
      address: p.address || "",
      durationMinutes: 90,
    })),
  ];

  if (totalStops.length === 0) {
    // Single Day Trip with Start & Destination
    const day1 = recalculateDaySchedule({
      dayNumber: 1,
      title: `Day 1: ${start.name?.split(",")[0] || "Start"} to ${destination.name?.split(",")[0] || "Destination"}`,
      startLocation: start,
      endLocation: destination,
      stops: [
        {
          id: `start-stop`,
          name: `Departure: ${start.name?.split(",")[0] || "Start"}`,
          lat: start.lat,
          lon: start.lon,
          category: "departure",
          durationMinutes: 30,
        },
        {
          id: `dest-stop`,
          name: `Arrival: ${destination.name?.split(",")[0] || "Destination"}`,
          lat: destination.lat,
          lon: destination.lon,
          category: "arrival",
          durationMinutes: 60,
        },
      ],
      notes: "Direct journey",
    });

    return [day1];
  }

  // If we have stops, divide them across days (up to 3 stops per day)
  const stopsPerDay = Math.max(2, Math.ceil(totalStops.length / 2));
  const numDays = Math.min(3, Math.ceil(totalStops.length / stopsPerDay));
  const days = [];

  for (let i = 0; i < numDays; i++) {
    const chunk = totalStops.slice(i * stopsPerDay, (i + 1) * stopsPerDay);
    const isFirst = i === 0;
    const isLast = i === numDays - 1;

    const dayStart = isFirst ? start : chunk[0] || start;
    const dayEnd = isLast ? destination : chunk[chunk.length - 1] || destination;

    const day = recalculateDaySchedule({
      dayNumber: i + 1,
      title: `Day ${i + 1}: Exploring ${chunk[0]?.name?.split(",")[0] || "Route Corridor"}`,
      startLocation: dayStart,
      endLocation: dayEnd,
      stops: chunk,
      notes: `Day ${i + 1} planned itinerary`,
    });

    days.push(day);
  }

  return days;
};

module.exports = {
  minutesToTimeString,
  timeStringToMinutes,
  recalculateDaySchedule,
  buildInitialMultiDayItinerary,
};

