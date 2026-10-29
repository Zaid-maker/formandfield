import axios from 'axios'

const apiHost = import.meta.env.VITE_API_HOST?.trim()
const backendUrl = apiHost
  ? /^https?:\/\//i.test(apiHost)
    ? apiHost
    : `https://${apiHost.includes('.') ? apiHost : `${apiHost}.onrender.com`}`
  : ''
const baseURL = backendUrl.replace(/\/+$/, '')

const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
