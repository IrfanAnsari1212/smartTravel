import axios from "axios";
import { API_BASE_URL, getStoredSession } from "./api";

const authConfig = () => {
  const token = getStoredSession()?.token;
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const planTripRequest = async (payload) => {
  const response = await axios.post(`${API_BASE_URL}/trip/route`, payload, authConfig());
  return response.data;
};

export const getTripHistory = async () => {
  const response = await axios.get(`${API_BASE_URL}/trip/history`, authConfig());
  return Array.isArray(response.data) ? response.data : [];
};

export const toggleFavoriteTrip = async (tripId) => {
  const response = await axios.patch(`${API_BASE_URL}/trip/${tripId}/favorite`, {}, authConfig());
  return response.data;
};

export const updateTripItineraryRequest = async (tripId, days) => {
  const response = await axios.put(
    `${API_BASE_URL}/trip/${tripId}/itinerary`,
    { days },
    authConfig()
  );
  return response.data;
};
