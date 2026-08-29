const { z } = require("zod");
const { findHotels } = require("../services/hotelService");

const searchHotelSchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
  query: z.string().trim().min(2).optional(),
  radius: z.coerce.number().min(1000).max(50000).optional().default(10000),
  checkIn: z.string().trim().optional(),
  checkOut: z.string().trim().optional(),
  guests: z.coerce.number().min(1).max(20).optional().default(2),
  rooms: z.coerce.number().min(1).max(10).optional().default(1),
});

const searchHotels = async (req, res, next) => {
  try {
    const payload = searchHotelSchema.parse({
      ...req.body,
      ...req.query,
    });

    const result = await findHotels(payload);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchHotels,
};

