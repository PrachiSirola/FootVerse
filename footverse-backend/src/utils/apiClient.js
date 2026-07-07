import fetch from "node-fetch";
import { getValidAccessToken } from "../services/cjAuthService.js";
import CJ_CONFIG from "../config/cjConfig.js";

async function request(method, endpoint, body = null) {
  const token = await getValidAccessToken();

  const options = {
    method,
    headers: {
      "CJ-Access-Token": token,
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(
    `${CJ_CONFIG.BASE_URL}${endpoint}`,
    options
  );

  const result = await response.json();

  if (!result.result) {
    throw new Error(result.message || "CJ API Error");
  }

  return result.data;
}

export const apiClient = {
  get(endpoint) {
    return request("GET", endpoint);
  },

  post(endpoint, body) {
    return request("POST", endpoint, body);
  },

  put(endpoint, body) {
    return request("PUT", endpoint, body);
  },

  delete(endpoint) {
    return request("DELETE", endpoint);
  },
};