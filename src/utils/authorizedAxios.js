import axios from 'axios'
import { toast } from 'react-toastify'
import { logoutAPI, refreshTokenAPI } from '~/apis'

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
    // Bearer la dinh nghia loai token danh cho viec xac thuc va uy quyen
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
}, (error) => {
  // Do something with request error
  return Promise.reject(error)
})


// Khoi tao mot cai promise cho viec goi api refresh token
// Muc dich tao promise nay de khi nhan yeu cau refresh token dau tien thi se hold lai cai API refresh token cho den khi no thuc hien xong xuoi
// thi moi retry lai cac api bi loi truoc do thay vi viec goi API refresh token lien tuc tuong ung voi cac API loi
let refreshTokenPromise = null


// Add a response interceptor: can thiep vao giua moi response API tra ve tu BE
authorizedAxiosInstance.interceptors.response.use((response) => {
  // Moi ma http status code nam trong khoang 200 - 299 se la success va roi vao day
  // Do something with response data
  return response
}, (error) => {
  // Moi ma http status code nam ngoai khoang 200 - 299 se la error va roi vao day

  /** Xu ly refresh token tu dong */
  // Truong hop nhan ma 401 tu BE thi goi API logout luon
  if (error.response?.status === 401) {
    logoutAPI()
      .then(() => {
        // Truong hop dung cookie thi can xoa userInfo trong localStorage
        // localStorage.removeItem('userInfo')

        // Kh dung hook navigate cua react-router-dom o day duoc vi no chi co pham vi tren component jsx chu kh phai tren file js -> dung JS thuan
        location.href = '/login'
      })
  }

  // Truong hop nhan ma 410 tu BE thi goi API refresh token de lam moi accessToken
  // Lay cac request API dang bi loi (accessToken het han) thong qua error.config
  const originalRequests = error.config
  if (error.response?.status === 410 && originalRequests) {
    if (!refreshTokenPromise) {
      const refreshToken = localStorage.getItem('refreshToken')
      // Call API refresh token va hold lai API refresh token vao promise
      refreshTokenPromise = refreshTokenAPI(refreshToken)
        .then(res => {
          // Gan lai accessToken moi vao Local Storage
          const { accessToken } = res
          localStorage.setItem('accessToken', accessToken)
          authorizedAxiosInstance.defaults.headers.Authorization = `Bearer ${accessToken}`

          // Truong hop Http Only Cookie thi da gan accessToken moi vao cookie trong ham refreshToken ben BE roi
        })
        .catch(_error => {
          // Neu nhan bat ky loi nao thi API refresh token thi cho logout luon
          logoutAPI()
            .then(() => {
              // Truong hop dung cookie thi can xoa userInfo trong localStorage
              // localStorage.removeItem('userInfo')

              location.href = '/login'
            })
          return Promise.reject(_error)
        })
        .finally(() => {
          // Du call API refresh token co thanh cong hay kh thi cx phai gan lai refreshTokenPromise ve null
          refreshTokenPromise = null
        })
    }

    // Return lai cai refreshTokenPromise trong truong hop success
    return refreshTokenPromise.then(() => {
      // Return lai axios instance ket hop voi originalRequests de goi lai cac Request API ban dau bi loi
      return authorizedAxiosInstance(originalRequests)
    })
  }


  // Xu ly tap trung phan hien thi thong bao loi tra ve tu moi API o day (chi can viet code mot lan)
  // console.log(error) ra se thay cau truc dan toi message loi
  // Dung toastify de hien thi bat ky ma loi len man hinh. Ngoai tru ma 410 - GONE phuc vu viec tu dong refresh lai token
  if (error.response?.status !== 410) {
    toast.error(error.response?.data?.message || error?.message)
  }

  return Promise.reject(error)
})

export default authorizedAxiosInstance
