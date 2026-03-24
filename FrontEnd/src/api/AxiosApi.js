// axiosApi.js
import axios from "axios";

// 기본 인스턴스 생성
const axiosApi = axios.create({
  baseURL: "http://192.168.1.66:8000/api", // API 서버 주소
  timeout: 5000,                        // 요청 제한 시간 (ms)
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터
axiosApi.interceptors.request.use(
  (config) => {
    // 예: 토큰 자동 추가
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터
axiosApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default axiosApi;