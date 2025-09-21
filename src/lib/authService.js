import api from './api';

export const registerUser = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    const { token } = response.data;
    if (token) {
      localStorage.setItem('userToken', token);
    }
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const checkUsernameExists = async (username) => {
  try {
    const response = await api.get(`/auth/check-username?username=${username}`);
    return response.data; // Should return { exists: boolean }
  } catch (error) {
    throw error.response.data;
  }
};