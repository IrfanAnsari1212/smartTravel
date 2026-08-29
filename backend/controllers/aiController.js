const { z } = require("zod");
const { buildTripContextSummary, SYSTEM_INSTRUCTIONS } = require("../services/aiContextBuilder");
const { queryGemini } = require("../adapters/aiAdapter");

const chatSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  tripContext: z
    .object({
      start: z.object({ name: z.string().optional(), lat: z.number().optional(), lon: z.number().optional() }).optional(),
      destination: z.object({ name: z.string().optional(), lat: z.number().optional(), lon: z.number().optional() }).optional(),
      distance: z.number().optional(),
      duration: z.number().optional(),
      places: z.array(z.any()).optional(),
      emergencyServices: z.record(z.string(), z.any()).optional(),
    })
    .optional()
    .default({}),
});

const itinerarySchema = z.object({
  days: z.coerce.number().int().min(1).max(7).default(2),
  preferences: z.string().trim().max(300).optional(),
  tripContext: z
    .object({
      start: z.object({ name: z.string().optional(), lat: z.number().optional(), lon: z.number().optional() }).optional(),
      destination: z.object({ name: z.string().optional(), lat: z.number().optional(), lon: z.number().optional() }).optional(),
      distance: z.number().optional(),
      duration: z.number().optional(),
      places: z.array(z.any()).optional(),
      emergencyServices: z.record(z.string(), z.any()).optional(),
    })
    .optional()
    .default({}),
});

const chatWithAssistant = async (req, res, next) => {
  try {
    const { message, tripContext } = chatSchema.parse(req.body);

    const contextSummary = buildTripContextSummary(tripContext);
    const userPrompt = `${contextSummary}\n\nUSER QUESTION/REQUEST:\n"${message}"\n\nPlease answer concisely, grounding your answer on the real verified places provided above.`;

    const result = await queryGemini({
      systemInstruction: SYSTEM_INSTRUCTIONS,
      userPrompt,
      tripContext,
    });

    res.json({
      reply: result.reply,
      recommendedPlaces: result.recommendedPlaces || [],
    });
  } catch (error) {
    next(error);
  }
};

const generateItinerary = async (req, res, next) => {
  try {
    const { days, preferences, tripContext } = itinerarySchema.parse(req.body);

    const contextSummary = buildTripContextSummary(tripContext);
    const userPrompt = `${contextSummary}\n\nUSER REQUEST:\nPlease generate a structured ${days}-day travel itinerary for this trip.${
      preferences ? ` User preferences: ${preferences}` : ""
    }\nOrganize each day clearly with Morning, Afternoon, and Evening activities using only the verified attractions, dining spots, and hotels listed above.`;

    const result = await queryGemini({
      systemInstruction: SYSTEM_INSTRUCTIONS,
      userPrompt,
      tripContext,
    });

    res.json({
      reply: result.reply,
      recommendedPlaces: result.recommendedPlaces || [],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  chatWithAssistant,
  generateItinerary,
};
