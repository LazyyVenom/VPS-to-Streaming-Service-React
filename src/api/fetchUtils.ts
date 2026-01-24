import { handleUnauthorized, getAccessToken, clearTokens } from "./authApi";

interface FetchOptions extends RequestInit {
  headers?: HeadersInit;
}

/**
 * Authenticated fetch wrapper that automatically handles token refresh on 401 errors
 */
export const authenticatedFetch = async (
  url: string,
  options: FetchOptions = {},
): Promise<Response> => {
  const token = getAccessToken();

  // Add authorization header if token exists
  const headers = new Headers(options.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Make the initial request
  let response = await fetch(url, {
    ...options,
    headers,
  });

  // If unauthorized, try to refresh the token and retry
  if (response.status === 401) {
    try {
      const newToken = await handleUnauthorized();

      // Retry the request with the new token
      headers.set("Authorization", `Bearer ${newToken}`);
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (error) {
      // Token refresh failed, redirect to login
      clearTokens();
      throw new Error("Session expired. Please login again.");
    }
  }

  return response;
};
