const { GoogleGenAI } = require("@google/genai");

const getGeminiClient = () => {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    return new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn("Failed to initialize GoogleGenAI client:", err.message);
    return null;
  }
};

const generateIntelligentFallbackReply = ({ message, tripContext = {} }) => {
  const lowerMsg = (message || "").toLowerCase();
  const places = tripContext.places || [];
  const distanceKm = tripContext.distance ? (tripContext.distance / 1000).toFixed(1) : "0";
  const durationHrs = tripContext.duration ? (tripContext.duration / 3600).toFixed(1) : "0";
  const destName = tripContext.destination?.name || "your destination";
  const startName = tripContext.start?.name || "your origin";

  const attractions = places.filter((p) => p.category === "attraction");
  const restaurants = places.filter((p) => p.category === "restaurant");
  const hotels = places.filter((p) => p.category === "hotel");
  const fuels = places.filter((p) => p.category === "fuel");
  const hospitals = places.filter((p) => p.category === "hospital");
  const police = places.filter((p) => p.category === "police");

  let replyText = "";
  let matchedPlaces = [];

  if (lowerMsg.includes("attraction") || lowerMsg.includes("visit") || lowerMsg.includes("see") || lowerMsg.includes("sight")) {
    if (attractions.length) {
      matchedPlaces = attractions.slice(0, 5);
      replyText = `Here are the top verified attractions along your route to **${destName}**:\n\n` +
        attractions.slice(0, 5).map((a, i) =>
          `**${i + 1}. ${a.name}**\n` +
          `• Category: Scenic Attraction / Landmark\n` +
          `• Address: ${a.address || "Near route corridor"}\n` +
          (a.highlights?.length ? `• Highlights: ${a.highlights.join(", ")}\n` : "")
        ).join("\n") +
        `\n\n💡 *Tip: Total route distance is ${distanceKm} km (~${durationHrs} hrs). Plan 45–60 minutes per attraction to keep your schedule relaxed.*`;
    } else {
      replyText = `We didn't detect specific tourist landmarks directly adjacent to this corridor, but **${destName}** offers plenty of local highlights upon arrival. We recommend checking local visitor centers or city center squares once you reach your destination.`;
    }
  } else if (lowerMsg.includes("food") || lowerMsg.includes("restaurant") || lowerMsg.includes("eat") || lowerMsg.includes("cafe") || lowerMsg.includes("lunch") || lowerMsg.includes("dinner")) {
    if (restaurants.length) {
      matchedPlaces = restaurants.slice(0, 5);
      replyText = `Here are great dining and rest stops verified along your drive from **${startName}** to **${destName}**:\n\n` +
        restaurants.slice(0, 5).map((r, i) =>
          `**${i + 1}. ${r.name}**\n` +
          (r.cuisine ? `• Specialty: ${r.cuisine}\n` : "") +
          (r.openingHours ? `• Hours: ${r.openingHours}\n` : "") +
          `• Location: ${r.address || "Along highway route"}\n`
        ).join("\n") +
        `\n\n☕ *Tip: On a ${durationHrs}-hour journey, taking a 20-minute meal break every 2 hours prevents driving fatigue.*`;
    } else {
      replyText = `There are no specific verified cafes registered on this exact segment. We recommend taking rest stops at major highway fuel plazas along the way.`;
    }
  } else if (lowerMsg.includes("hotel") || lowerMsg.includes("stay") || lowerMsg.includes("lodging") || lowerMsg.includes("resort")) {
    if (hotels.length) {
      matchedPlaces = hotels.slice(0, 5);
      replyText = `Here are verified lodging options and hotels along your route to **${destName}**:\n\n` +
        hotels.slice(0, 5).map((h, i) =>
          `**${i + 1}. ${h.name}**\n` +
          `• Type: Hotel / Lodging\n` +
          `• Address: ${h.address || "Destination area"}\n` +
          (h.phone ? `• Contact: ${h.phone}\n` : "")
        ).join("\n") +
        `\n\n🛏️ *Tip: If you plan to arrive late in ${destName}, consider calling ahead to confirm late check-in availability.*`;
    } else {
      replyText = `No registered hotels were identified on this immediate route segment. We recommend booking accommodation ahead of time in **${destName}**.`;
    }
  } else if (lowerMsg.includes("fuel") || lowerMsg.includes("gas") || lowerMsg.includes("ev") || lowerMsg.includes("charge")) {
    if (fuels.length) {
      matchedPlaces = fuels.slice(0, 4);
      replyText = `Here are verified fuel and refueling points along your route:\n\n` +
        fuels.slice(0, 4).map((f, i) =>
          `**${i + 1}. ${f.name}**\n` +
          (f.brand ? `• Brand: ${f.brand}\n` : "") +
          `• Location: ${f.address || "Highway corridor"}\n`
        ).join("\n") +
        `\n\n⛽ *Tip: Keep your tank above 25% especially when driving through expressway stretches.*`;
    } else {
      replyText = `No specific fuel pumps were found in the immediate search radius. Please refill before embarking on the ${distanceKm} km route.`;
    }
  } else if (lowerMsg.includes("emergency") || lowerMsg.includes("hospital") || lowerMsg.includes("police") || lowerMsg.includes("help") || lowerMsg.includes("safety")) {
    matchedPlaces = [...hospitals, ...police].slice(0, 4);
    replyText = `🚨 **Safety & Emergency Overview for your route to ${destName}**:\n\n` +
      (hospitals.length ? `• **Nearest Hospital**: ${hospitals[0].name} (${hospitals[0].address || "On route"})\n` : "• Hospital services available in central districts.\n") +
      (police.length ? `• **Police Station**: ${police[0].name} (${police[0].address || "On route"})\n` : "• Emergency police hotline is accessible along the highway.\n") +
      `\n*Always keep emergency numbers saved and download an offline route pack if you anticipate low mobile connectivity.*`;
  } else if (lowerMsg.includes("itinerary") || lowerMsg.includes("plan") || lowerMsg.includes("day") || lowerMsg.includes("schedule")) {
    matchedPlaces = [...attractions, ...restaurants, ...hotels].slice(0, 6);
    replyText = `Here is a suggested travel itinerary for your **${distanceKm} km** trip to **${destName}**:\n\n` +
      `**Morning / Departure:**\n` +
      `• Start from **${startName}**\n` +
      (fuels.length ? `• Refuel at **${fuels[0].name}**\n` : "") +
      `• Begin steady drive along the recommended corridor.\n\n` +
      `**Midday / Lunch & Sightseeing:**\n` +
      (restaurants.length ? `• Lunch break at **${restaurants[0].name}**\n` : "• Take a 30-minute rest stop.\n") +
      (attractions.length ? `• Explore **${attractions[0].name}**\n` : "") +
      `\n**Evening / Arrival in ${destName}:**\n` +
      (hotels.length ? `• Check-in at **${hotels[0].name}**\n` : `• Arrive in ${destName}\n`) +
      (attractions.length > 1 ? `• Evening visit to **${attractions[1].name}**\n` : "") +
      (restaurants.length > 1 ? `• Dinner at **${restaurants[1].name}**\n` : "");
  } else {
    matchedPlaces = places.slice(0, 4);
    replyText = `I'm your AI Travel Assistant for your trip from **${startName}** to **${destName}** (${distanceKm} km, ~${durationHrs} hrs drive).\n\n` +
      `I can help you with:\n` +
      `• **Top Attractions & Sights** along the route\n` +
      `• **Recommended Dining & Cafes** for rest stops\n` +
      `• **Hotel & Accommodation** options\n` +
      `• **Safety & Emergency** facilities (Hospitals, Police, Fuel)\n` +
      `• **Custom Draft Itineraries**\n\n` +
      `How can I assist your travel plans today?`;
  }

  return {
    reply: replyText,
    recommendedPlaces: matchedPlaces,
  };
};

const queryGemini = async ({ systemInstruction, userPrompt, tripContext }) => {
  const ai = getGeminiClient();

  if (!ai) {
    return generateIntelligentFallbackReply({
      message: userPrompt,
      tripContext,
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    const replyText = response.text || "";

    // Match any referenced place IDs from the trip context
    const places = tripContext.places || [];
    const recommendedPlaces = places.filter(
      (p) =>
        replyText.toLowerCase().includes(p.name.toLowerCase()) ||
        replyText.includes(p.id)
    );

    return {
      reply: replyText,
      recommendedPlaces: recommendedPlaces.slice(0, 6),
    };
  } catch (error) {
    console.warn("Gemini API call failed, falling back to grounded rule engine:", error.message);
    return generateIntelligentFallbackReply({
      message: userPrompt,
      tripContext,
    });
  }
};

module.exports = {
  queryGemini,
  generateIntelligentFallbackReply,
};

