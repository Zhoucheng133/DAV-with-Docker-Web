import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

export interface ApiResponse<T = any> {
  ok: boolean;
  data: T;
}

const api = axios.create({
  baseURL: '',
  timeout: 10000,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('dav_token');
    if (token) {
      config.headers.set('token', token);
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response: any) => {
    const res = response.data as ApiResponse;
    if (res && res.ok === false) {
      if (res.data === 'expired' || res.data === 'missing token') {
        const originalRequest = response.config as InternalAxiosRequestConfig & { _retry?: boolean };
        
        if (originalRequest._retry) {
          localStorage.removeItem('dav_token');
          window.location.href = '/login';
          return Promise.reject(new Error('Token expired and refresh failed'));
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (token: string) => {
                originalRequest.headers.set('token', token);
                resolve(api(originalRequest));
              },
              reject: (err) => {
                reject(err);
              },
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        return new Promise(async (resolve, reject) => {
          try {
            const refreshRes = await axios.get<ApiResponse>('/api/refresh');
            if (refreshRes.data && refreshRes.data.ok) {
              const newToken = refreshRes.data.data;
              localStorage.setItem('dav_token', newToken);
              api.defaults.headers.common['token'] = newToken;
              processQueue(null, newToken);
              originalRequest.headers.set('token', newToken);
              resolve(api(originalRequest));
            } else {
              processQueue(new Error('Refresh failed'), null);
              localStorage.removeItem('dav_token');
              window.location.href = '/login';
              reject(new Error('Refresh failed'));
            }
          } catch (err) {
            processQueue(err, null);
            localStorage.removeItem('dav_token');
            window.location.href = '/login';
            reject(err);
          } finally {
            isRefreshing = false;
          }
        });
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const responseData = error.response?.data as ApiResponse | undefined;

    if (error.response?.status === 401 || (responseData && responseData.ok === false && (responseData.data === 'expired' || responseData.data === 'missing token'))) {
      if (originalRequest._retry) {
        localStorage.removeItem('dav_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.set('token', token);
              resolve(api(originalRequest));
            },
            reject: (err) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await axios.get<ApiResponse>('/api/refresh');
        if (refreshRes.data && refreshRes.data.ok) {
          const newToken = refreshRes.data.data;
          localStorage.setItem('dav_token', newToken);
          processQueue(null, newToken);
          originalRequest.headers.set('token', newToken);
          return api(originalRequest);
        } else {
          processQueue(new Error('Refresh failed'), null);
          localStorage.removeItem('dav_token');
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('dav_token');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
