import axios from 'axios'

const ACCESS_TOKEN_KEY = 'accessToken'
const apiHost = import.meta.env.VITE_API_HOST?.trim()
const backendUrl = apiHost
  ? /^https?:\/\//i.test(apiHost)
    ? apiHost
    : `https://${apiHost.includes('.') ? apiHost : `${apiHost}.onrender.com`}`
  : ''
const baseURL = backendUrl.replace(/\/+$/, '')

let accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY)
let refreshPromise

export function setAccessToken(token) {
  accessToken = token
  if (token) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
  } else {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  }
}

export function hasAccessToken() {
  return Boolean(accessToken)
}

export async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
      .then(({ data }) => {
        if (!data.accessToken) {
          throw new Error('Refresh response did not include an access token')
        }
        setAccessToken(data.accessToken)
        return data.accessToken
      })
      .finally(() => {
        refreshPromise = undefined
      })
  }
  return refreshPromise
}

const api = axios.create({ baseURL, withCredentials: true })

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

api.interceptors.response.use(undefined, async (error) => {
  const config = error.config
  const isAuthRequest = config?.url?.startsWith('/auth/')
  if (error.response?.status !== 401 || !config || config._retry || isAuthRequest) {
    return Promise.reject(error)
  }

  config._retry = true
  try {
    const token = await refreshAccessToken()
    config.headers.Authorization = `Bearer ${token}`
    return api(config)
  } catch (refreshError) {
    if (refreshError.response?.status === 401) {
      setAccessToken(null)
      refreshError.authSessionExpired = true
    }
    return Promise.reject(refreshError)
  }
})

export default api
