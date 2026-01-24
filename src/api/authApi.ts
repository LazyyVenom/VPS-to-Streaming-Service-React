import config from "../config/config";

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
}

// Login user
export const loginUser = async (
  payload: LoginPayload,
): Promise<LoginResponse> => {
  try {
    const response = await fetch(
      `${config.BASE_URL}${config.API_ENDPOINTS.LOGIN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Login failed: ${response.statusText}`,
      );
    }

    const data: LoginResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

// Store tokens in localStorage
export const storeTokens = (tokens: LoginResponse, username: string): void => {
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);
  localStorage.setItem("token_type", tokens.token_type);
  localStorage.setItem("username", username);
};

// Get access token
export const getAccessToken = (): string | null => {
  return localStorage.getItem("access_token");
};

// Clear tokens (logout)
export const clearTokens = (): void => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("token_type");
  localStorage.removeItem("username");
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

// Get refresh token
export const getRefreshToken = (): string | null => {
  return localStorage.getItem("refresh_token");
};

// Refresh access token using refresh token
export const refreshAccessToken = async (): Promise<LoginResponse> => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await fetch(
      `${config.BASE_URL}${config.API_ENDPOINTS.REFRESH}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Token refresh failed: ${response.statusText}`,
      );
    }

    const data: LoginResponse = await response.json();
    // Update stored tokens
    localStorage.setItem("access_token", data.access_token);
    if (data.refresh_token) {
      localStorage.setItem("refresh_token", data.refresh_token);
    }
    return data;
  } catch (error) {
    console.error("Error refreshing token:", error);
    // Clear tokens on refresh failure
    clearTokens();
    throw error;
  }
};

// Setup automatic token refresh
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

export const handleUnauthorized = async (): Promise<string> => {
  if (!isRefreshing) {
    isRefreshing = true;
    try {
      const response = await refreshAccessToken();
      isRefreshing = false;
      onRefreshed(response.access_token);
      return response.access_token;
    } catch (error) {
      isRefreshing = false;
      throw error;
    }
  }

  // Wait for the token to be refreshed
  return new Promise((resolve) => {
    addRefreshSubscriber((token: string) => {
      resolve(token);
    });
  });
};
