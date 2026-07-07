import fetch from "node-fetch";
import dotenv from "dotenv";
import CJ_CONFIG from "../config/cjConfig.js";

dotenv.config();

// Token storage (kept in memory while server is running)
let accessToken = null;
let refreshToken = null;
let tokenExpiry = null;

/**
 * Login using API Key
 */
export async function login() {
  console.log("🔑 Logging into CJ...");

  const response = await fetch(
    `${CJ_CONFIG.BASE_URL}${CJ_CONFIG.AUTH.LOGIN}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKey: process.env.CJ_API_KEY,
      }),
    }
  );

  const result = await response.json();

  if (!result.result) {
    throw new Error(result.message || "CJ Login Failed");
  }

  accessToken = result.data.accessToken;
  refreshToken = result.data.refreshToken;
  tokenExpiry = new Date(result.data.accessTokenExpiryDate);

  console.log("✅ CJ Login Successful");

  return accessToken;
}

/**
 * Refresh Access Token
 * (We'll fully implement this in the next step.)
 */
export async function refreshAccessToken() {
  console.log("🔄 Refresh token feature coming next...");
}

/**
 * Logout
 * (We'll implement after refresh.)
 */
export async function logout() {
  console.log("🚪 Logout feature coming next...");
}

/**
 * Returns a valid access token.
 * If none exists, logs in automatically.
 */
export async function getValidAccessToken() {
  console.log("========== AUTH DEBUG ==========");
  console.log("Current Access Token:", accessToken);
  console.log("API Key:", process.env.CJ_API_KEY);

  if (!accessToken) {
    console.log("❌ No access token found.");
    console.log("Calling login()...");
    await login();
  }

  console.log("✅ Returning token.");
  console.log("===============================");

  return accessToken;
}