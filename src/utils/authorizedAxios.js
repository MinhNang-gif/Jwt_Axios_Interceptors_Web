import axios from 'axios'
import { toast } from 'react-toastify'

// Khoi tao doi tuong authorizedAxiosInstance de custom va cau hinh chung cho du an
let authorizedAxiosInstance = axios.create()
// Thoi gian cho toi da cua mot request: cho 10p
authorizedAxiosInstance.defaults.timeout = 1000 * 60 * 10
// withCredentials: cho phep authorizedAxiosInstance tu dong dinh kem va gui cookie trong moi request len BE (phuc vu truong hop neu su dung JWT Tokens (access & refresh) theo co che httpOnly Cookie)
authorizedAxiosInstance.defaults.withCredentials = true


/** Cau hinh Interceptors (bo danh chan vao giua moi Request & Response)
 * https://axios-http.com/docs/interceptors
 */
// Add a request interceptor: can thiep vao giua moi request API gui len tu FE
authorizedAxiosInstance.interceptors.request.use((config) => {
  // Lay accessToken trong Local Storage va dinh kem vao header trong request API
  const accessToken = localStorage.getItem('accessToken')
  if (accessToken) {
    // Can them 'Bearer' vi nen tuan thu theo tieu chuan OAuth 2.0 trong viec xac dinh loai token dang su dung
    // Bearer la dinh nghia loai token danh cho viec xac thuc va uy quyen, mot vai loai token khac nhu: Basic token, Digest token, OAuth token,...
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
}, (error) => {
  // Do something with request error
  return Promise.reject(error)
})

// Add a response interceptor: can thiep vao giua moi response API tra ve tu BE
authorizedAxiosInstance.interceptors.response.use((response) => {
  // Moi ma http status code nam trong khoang 200 - 299 se la success va roi vao day
  // Do something with response data
  return response
}, (error) => {
  // Moi ma http status code nam ngoai khoang 200 - 299 se la error va roi vao day
  // Xu ly tap trung phan hien thi thong bao loi tra ve tu moi API o day (chi can viet code mot lan)
  // console.log(error) ra se thay cau truc dan toi message loi
  // Dung toastify de hien thi bat ky ma loi len man hinh. Ngoai tru ma 410 - GONE phuc vu viec tu dong refresh lai token
  if (error.response?.status !== 410) {
    toast.error(error.response?.data?.message || error?.message)
  }

  return Promise.reject(error)
})

export default authorizedAxiosInstance
