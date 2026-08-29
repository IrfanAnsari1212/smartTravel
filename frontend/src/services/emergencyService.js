import axios from "axios";
import { API_BASE_URL, getStoredSession } from "./api";

const authConfig = () => {
  const token = getStoredSession()?.token;
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const fetchEmergencyContacts = async () => {
  const response = await axios.get(`${API_BASE_URL}/emergency/contacts`, authConfig());
  return Array.isArray(response.data) ? response.data : [];
};

export const addEmergencyContact = async (contact) => {
  const response = await axios.post(`${API_BASE_URL}/emergency/contacts`, contact, authConfig());
  return response.data;
};

export const updateEmergencyContact = async (id, contact) => {
  const response = await axios.put(`${API_BASE_URL}/emergency/contacts/${id}`, contact, authConfig());
  return response.data;
};

export const deleteEmergencyContact = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/emergency/contacts/${id}`, authConfig());
  return response.data;
};

export const fetchNearbyEmergencyServices = async (lat, lon, radius = 5000) => {
  const response = await axios.get(`${API_BASE_URL}/emergency/nearby`, {
    params: { lat, lon, radius },
    ...authConfig(),
  });
  return response.data;
};

