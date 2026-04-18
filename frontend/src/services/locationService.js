import axios from "axios";

import { API_BASE_URL } from "./api";

export const searchPlaces = async (query) => {
  if (!query?.trim()) {
    return [];
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/locations/search`, {
      params: { q: query.trim() },
    });

    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};
