import axios from 'axios'

const apiHost = import.meta.env.VITE_API_HOST
const baseURL = apiHost ? `https://${apiHost}` : ''

const api = axios.create({ baseURL })

export default api
