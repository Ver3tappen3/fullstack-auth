import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",

  withCredentials: true,

  headers: {
    "Content-Type": "application/json"
  }
});

let accessToken = null;


let refreshPromise = null;


export function setAccessToken(token) {
  accessToken = token;
}


export function getAccessToken() {
  return accessToken;
}

api.interceptors.request.use(
  config => {
    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
    }

    return config;
  }
);

api.interceptors.response.use(
  response => response,

  async error => {
    const originalRequest =
      error.config;


    /*
     * Обрабатываем только 401.
     */

    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      originalRequest?.url === "/refresh" ||
      originalRequest?.url === "/login"
    ) {
      return Promise.reject(error);
    }


    originalRequest._retry = true;


    try {

      if (!refreshPromise) {
        refreshPromise =
          api
            .post("/refresh")
            .then(response => {
              const newToken =
                response.data.accessToken;

              setAccessToken(
                newToken
              );

              return newToken;
            })
            .finally(() => {
              refreshPromise = null;
            });
      }


      const newToken =
        await refreshPromise;


      originalRequest.headers.Authorization =
        `Bearer ${newToken}`;


      return api(
        originalRequest
      );
    } catch (refreshError) {
      setAccessToken(null);

      return Promise.reject(
        refreshError
      );
    }
  }
);


export default api;