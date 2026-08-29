import axios from "axios";
import { API_BASE_URL, clearStoredSession, getStoredSession, storeSession } from "./api";

const persistSession = (session) => {
  storeSession(session);
  return session;
};

export const register = async (payload) => {
  const response = await axios.post(`${API_BASE_URL}/auth/register`, payload);
  return persistSession(response.data);
};

export const login = async (payload) => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, payload);
  return persistSession(response.data);
};

export const logout = () => clearStoredSession();

export const getSession = () => getStoredSession();
