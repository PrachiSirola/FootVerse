import axios from "axios";

let accessToken = null;
let refreshToken = null;
let accessTokenExpiry = null;
let refreshTokenExpiry = null;

export const cj = axios.create({
  baseURL: process.env.CJ_API_BASE,
});

export const tokenStore = {
  get accessToken() {
    return accessToken;
  },

  setTokens(tokens) {
    accessToken = tokens.accessToken;
    refreshToken = tokens.refreshToken;
    accessTokenExpiry = tokens.accessTokenExpiryDate;
    refreshTokenExpiry = tokens.refreshTokenExpiryDate;
  },

  get refreshToken() {
    return refreshToken;
  },

  get accessTokenExpiry() {
    return accessTokenExpiry;
  },

  get refreshTokenExpiry() {
    return refreshTokenExpiry;
  },
};