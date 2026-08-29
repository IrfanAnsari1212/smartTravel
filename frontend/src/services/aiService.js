import axios from "axios";
import { API_BASE_URL, getStoredSession } from "./api";

const authConfig = (explicitToken) => {
  const token = explicitToken || getStoredSession()?.token;
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const sendAIChatMessage = async ({ message, tripContext, token }) => {
  const response = await axios.post(
    `${API_BASE_URL}/ai/chat`,
    {
      message,
      tripContext,
    },
    authConfig(token)
  );
  return response.data;
};

export const requestAITripItinerary = async ({
  tripContext,
  days = 2,
  preferences = "",
  token,
}) => {
  const response = await axios.post(
    `${API_BASE_URL}/ai/itinerary`,
    {
      days,
      preferences,
      tripContext,
    },
    authConfig(token)
  );
  return response.data;
};
