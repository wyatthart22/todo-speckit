import apiClient from "./services.js";

export default {
  loginUser(data) {
    return apiClient.post("login", data);
  },

  registerUser(data) {
    return apiClient.post("register", data);
  },

  logoutUser() {
    return apiClient.post("logout");
  },
};
