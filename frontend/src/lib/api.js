import axios from 'axios'

const apiHost = import.meta.env.VITE_API_HOST?.trim()
const backendUrl = apiHost
  ? /^https?:\/\//i.test(apiHost)
    ? apiHost
    : `https://${apiHost.includes('.') ? apiHost : `${apiHost}.onrender.com`}`
  : ''
const baseURL = backendUrl.replace(/\/+$/, '')

const api = axios.create({ baseURL })

export default api
