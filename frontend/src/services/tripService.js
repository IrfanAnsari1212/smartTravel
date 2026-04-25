import axios from "axios";
import { API_BASE_URL } from "./api";

export const planTripRequest = async (payload) => {
  const response = await axios.post(`${API_BASE_URL}/trip/route`, payload);
  return response.data;
};

export const getTripHistory = async () => {
  const response = await axios.get(`${API_BASE_URL}/trip/history`);
  return Array.isArray(response.data) ? response.data : [];
};

export const toggleFavoriteTrip = async (tripId) => {
  const response = await axios.patch(`${API_BASE_URL}/trip/${tripId}/favorite`);
  return response.data;
};
