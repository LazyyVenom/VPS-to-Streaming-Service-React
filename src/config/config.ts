export const config = {
  BASE_URL: "https://flix.anubhavchoubey.com/api/", // Change this to your backend URL
  API_ENDPOINTS: {
    USERS: "/auth/users",
    LOGIN: "/auth/login",
    VIDEOS: "videos",
    PLAYLISTS: "playlists",
    // Add more endpoints here as needed
  },
  APP: {
    NAME: "ANUBHAVFLIX",
    VERSION: "1.0.0",
  },
} as const;

export default config;
