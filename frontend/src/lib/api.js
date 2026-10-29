import axios from 'axios'

const apiHost = import.meta.env.VITE_API_HOST?.trim()
const baseURL = apiHost
  ? (/^https?:\/\//i.test(apiHost) ? apiHost : `https://${apiHost}`).replace(/\/+$/, '')
  : ''

const api = axios.create({ baseURL })

export default api
