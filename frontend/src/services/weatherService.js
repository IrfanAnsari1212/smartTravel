import axios from "axios";
import { API_BASE_URL } from "./api";

export const fetchPointWeather = async ({ lat, lon, name = "", query = "" }) => {
  const response = await axios.get(`${API_BASE_URL}/weather/point`, {
    params: { lat, lon, name, query },
  });
  return response.data;
};

export const fetchRouteWeather = async ({ start, destination, waypoints = [], stops = [] }) => {
  const response = await axios.post(`${API_BASE_URL}/weather/route`, {
    start,
    destination,
    waypoints,
    stops,
  });
  return response.data;
};
