import authorizedAxiosInstance from '~/utils/authorizedAxios'
import { API_ROOT } from '~/utils/constants'

export const loginAPI = async (data) => {
  const res = await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/login`, data)
  return res.data
}

export const accessAPI = async () => {
  const res = await authorizedAxiosInstance.get(`${API_ROOT}/v1/dashboards/access`)
  return res.data
}

export const logoutAPI = async () => {
  // Truong hop dung Local Storage -> xoa thong tin user trong Local Storage phia FE
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('userInfo')

  // Truong hop dung Http Only Cokkie -> goi API remove cookies
  await authorizedAxiosInstance.delete(`${API_ROOT}/v1/users/logout`)
}

export const refreshTokenAPI = async (refreshToken) => {
  const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/users/refresh_token`, { refreshToken })
  return response.data
}
