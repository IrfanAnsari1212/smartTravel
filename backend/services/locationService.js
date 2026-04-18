// const axios = require("axios");

// const getCoordinates = async (place) => {
//   const token = process.env.LOCATIONIQ_TOKEN;

//   const url = `https://us1.locationiq.com/v1/search.php?key=${token}&q=${place}&format=json`;

//   const response = await axios.get(url);

//   return {
//     lat: response.data[0].lat,
//     lon: response.data[0].lon
//   };
// };

// module.exports = { getCoordinates };

import axios from "axios";

const url = `https://us1.locationiq.com/v1/search.php?key=${token}&q=${place}&format=json`;

export const searchPlaces = async (query) => {
  if (!query) return [];

  try {
    const res = await axios.get(
      `https://us1.locationiq.com/v1/autocomplete?key=${API_KEY}&q=${query}&limit=5&format=json`
    );
    return res.data;
  } catch (err) {
    console.error(err);
    return [];
  }
};