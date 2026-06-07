import axios from 'axios';

// Replace with your Render URL or local IP for testing
const API_BASE_URL = 'https://tusic-backend.onrender.com'; 

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000, // 20 seconds
});

// Add a request interceptor for debugging
api.interceptors.request.use(request => {
  console.log('Starting Request', JSON.stringify(request, null, 2))
  return request
})

api.interceptors.response.use(response => {
  console.log('Response:', JSON.stringify(response.data, null, 2))
  return response
}, error => {
  console.log('Response Error:', error.message)
  return Promise.reject(error)
})

export const TusicAPI = {
  search: async (query) => {
    const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
    return response.data.results;
  },
  getRadio: async (videoId) => {
    const response = await api.get(`/radio?id=${videoId}`);
    return response.data.results;
  },
  resolve: async (videoId) => {
    const response = await api.get(`/resolve?id=${videoId}`);
    return response.data.url;
  },
  getLyrics: async (videoId) => {
    const response = await api.get(`/lyrics?id=${videoId}`);
    return response.data.lyrics;
  },
};

export default api;
