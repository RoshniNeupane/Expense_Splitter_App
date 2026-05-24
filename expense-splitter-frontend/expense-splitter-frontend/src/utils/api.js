import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE}/token/refresh/`, { refresh });
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch { localStorage.clear(); window.location.href = '/login'; }
      }
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: d => api.post('/auth/register/', d),
  login: d => api.post('/token/', d),
  profile: () => api.get('/auth/profile/'),
  updateProfile: d => api.patch('/auth/profile/', d),
  searchUsers: q => api.get(`/auth/search/?q=${encodeURIComponent(q)}`),
};

export const groupsAPI = {
  list: () => api.get('/groups/'),
  create: d => api.post('/groups/', d),
  get: id => api.get(`/groups/${id}/`),
  update: (id, d) => api.patch(`/groups/${id}/`, d),
  delete: id => api.delete(`/groups/${id}/`),
  addMember: (id, email) => api.post(`/groups/${id}/add_member/`, { email }),
  removeMember: (id, userId) => api.post(`/groups/${id}/remove_member/`, { user_id: userId }),
  balances: id => api.get(`/groups/${id}/balances/`),
  summary: id => api.get(`/groups/${id}/summary/`),
};

export const expensesAPI = {
  list: gId => api.get(`/groups/${gId}/expenses/`),
  create: (gId, d) => api.post(`/groups/${gId}/expenses/`, d),
  update: (gId, id, d) => api.patch(`/groups/${gId}/expenses/${id}/`, d),
  delete: (gId, id) => api.delete(`/groups/${gId}/expenses/${id}/`),
};

export const settlementsAPI = {
  list: gId => api.get(`/groups/${gId}/settlements/`),
  create: (gId, d) => api.post(`/groups/${gId}/settlements/`, d),
  complete: (gId, id) => api.post(`/groups/${gId}/settlements/${id}/complete/`),
};

export const activitiesAPI = {
  list: gId => api.get(`/groups/${gId}/activities/`),
};

export const dashboardAPI = { get: () => api.get('/dashboard/') };

export default api;
