import axios from "axios";

const API_KEY = "pk.639c444e0133718e6739660af9def11d";

export const searchPlaces = async (query) => {
  if (!query) return [];

  const url = `https://us1.locationiq.com/v1/autocomplete?key=${API_KEY}&q=${query}&limit=5&format=json`;

  try {
    const res = await axios.get(url);
    return res.data;
  } catch (err) {
    console.error(err);
    return [];
  }
};