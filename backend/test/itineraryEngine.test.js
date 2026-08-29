const assert = require("node:assert/strict");
const test = require("node:test");
const {
  minutesToTimeString,
  timeStringToMinutes,
  recalculateDaySchedule,
  buildInitialMultiDayItinerary,
} = require("../utils/itineraryEngine");

test("minutesToTimeString and timeStringToMinutes convert correctly", () => {
  assert.equal(minutesToTimeString(570), "09:30");
  assert.equal(minutesToTimeString(840), "14:00");
  assert.equal(timeStringToMinutes("09:30"), 570);
  assert.equal(timeStringToMinutes("14:00"), 840);
});

test("recalculateDaySchedule computes arrival and departure sequences", () => {
  const day = {
    dayNumber: 1,
    stops: [
      { name: "Stop A", lat: 28.6139, lon: 77.209, durationMinutes: 60 },
      { name: "Stop B", lat: 27.175, lon: 78.0422, durationMinutes: 90 },
    ],
  };

  const schedule = recalculateDaySchedule(day, 9 * 60); // Start at 09:00

  assert.equal(schedule.stops.length, 2);
  assert.equal(schedule.stops[0].estimatedArrival, "09:00");
  assert.equal(schedule.stops[0].departureTime, "10:00");
  assert.ok(schedule.stops[1].distanceFromPrevKm > 100);
  assert.ok(schedule.totalDistanceKm > 100);
  assert.ok(schedule.totalDurationMinutes > 150);
});

test("buildInitialMultiDayItinerary creates balanced multi-day breakdown", () => {
  const start = { name: "Delhi", lat: 28.6139, lon: 77.209 };
  const destination = { name: "Agra", lat: 27.175, lon: 78.0422 };
  const waypoints = [{ name: "Mathura", lat: 27.4924, lon: 77.6737 }];
  const places = [
    { id: "1", name: "Red Fort", lat: 28.6562, lon: 77.241, category: "attraction" },
    { id: "2", name: "Krishna Janmabhoomi", lat: 27.505, lon: 77.67, category: "attraction" },
    { id: "3", name: "Taj Mahal", lat: 27.1751, lon: 78.0421, category: "attraction" },
  ];

  const days = buildInitialMultiDayItinerary(start, destination, waypoints, places);

  assert.ok(days.length >= 1);
  assert.equal(days[0].dayNumber, 1);
  assert.ok(days[0].stops.length > 0);
});

