import axios from "axios";

const API_URL = "http://localhost:8000/users/";

// Create axios instance with CSRF token handling
const axiosInstance = axios.create({
  withCredentials: true,
});

// Add request interceptor to include CSRF token
axiosInstance.interceptors.request.use(
  (config) => {
    // Get CSRF token from cookies
    const csrfToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("csrftoken="))
      ?.split("=")[1];

    if (csrfToken) {
      config.headers["X-CSRFToken"] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

const authService = {
  // Get CSRF token first
  getCSRFToken: async () => {
    try {
      await axiosInstance.get(API_URL + "api/csrf/");
    } catch (error) {
      console.error("Failed to fetch CSRF token:", error);
    }
  },

  // Register a new user
  register: async (username, email, password1, password2) => {
    try {
      // Get CSRF token first
      await authService.getCSRFToken();

      const response = await axiosInstance.post(API_URL + "api/register/", {
        username,
        email,
        password1,
        password2,
      });

      if (response.data && response.data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            username: response.data.user,
            email: response.data.email,
          }),
        );
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Registration failed" };
    }
  },

  // Login user
  login: async (username, password) => {
    try {
      // Get CSRF token first
      await authService.getCSRFToken();

      const response = await axiosInstance.post(API_URL + "api/login/", {
        username,
        password,
      });

      if (response.data && response.data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            username: response.data.user,
            email: response.data.email,
          }),
        );
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Login failed" };
    }
  },

  // Logout user
  logout: async () => {
    try {
      await axiosInstance.post(API_URL + "api/logout/");
      localStorage.removeItem("user");
    } catch (error) {
      console.error("Logout error:", error);
      // Still remove from localStorage even if API call fails
      localStorage.removeItem("user");
    }
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },

  // Check if user is logged in
  isLoggedIn: () => {
    return !!localStorage.getItem("user");
  },

  // Get user profile
  getUserProfile: async () => {
    try {
      const response = await axiosInstance.get(API_URL + "api/user/");
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to fetch user profile" };
    }
  },
};

export default authService;
