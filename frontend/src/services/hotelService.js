import axios from "axios";
import { API_BASE_URL, getStoredSession } from "./api";

const authConfig = () => {
  const token = getStoredSession()?.token;
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const searchHotelsRequest = async (payload) => {
  const response = await axios.post(`${API_BASE_URL}/hotels/search`, payload, authConfig());
  return response.data;
};

