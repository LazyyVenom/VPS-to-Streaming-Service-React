import config from "../config/config";

export interface Video {
  id: string;
  title: string;
  owner_id: string;
  url: string;
  thumbnail_url: string;
  status: "UPLOADING" | "PROCESSING" | "READY" | "FAILED";
  created_at: string;
}

// Get access token from localStorage
const getAccessToken = (): string | null => {
  return localStorage.getItem("access_token");
};

// Fetch all videos
export const fetchVideos = async (): Promise<Video[]> => {
  try {
    const token = getAccessToken();
    const response = await fetch(
      `${config.BASE_URL}${config.API_ENDPOINTS.VIDEOS}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Failed to fetch videos: ${response.statusText}`
      );
    }

    const data: Video[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching videos:", error);
    throw error;
  }
};

// Add video via torrent/magnet link
export interface AddVideoPayload {
  torrent_url: string;
}

export const addVideoFromTorrent = async (
  payload: AddVideoPayload
): Promise<Video> => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error("Authentication required. Please login first.");
    }

    const response = await fetch(
      `${config.BASE_URL}${config.API_ENDPOINTS.VIDEOS}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Failed to add video: ${response.statusText}`
      );
    }

    const data: Video = await response.json();
    return data;
  } catch (error) {
    console.error("Error adding video:", error);
    throw error;
  }
};

// Search videos (client-side filtering for now)
export const searchVideos = (videos: Video[], query: string): Video[] => {
  if (!query.trim()) {
    return videos;
  }

  const lowerQuery = query.toLowerCase();
  return videos.filter((video) =>
    video.title.toLowerCase().includes(lowerQuery)
  );
};
