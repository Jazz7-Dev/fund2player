import axios from 'axios';

export const login = async (credentials) => {
  const response = await axios.post('/api/login', credentials);
  return response.data;
};