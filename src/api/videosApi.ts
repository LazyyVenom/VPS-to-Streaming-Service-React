import config from "../config/config";

export interface Video {
  id: string;
  title: string;
  owner_id: string;
  storage_path: string;
  thumbnail_url: string;
  status:
    | "UPLOADING"
    | "DOWNLOADING"
    | "PROCESSING"
    | "PROCESSED"
    | "READY"
    | "FAILED";
  created_at: string;
  duration_seconds: number;
  width: number;
  height: number;
  size_bytes: number;
}

export interface Playlist {
  id: string;
  title: string;
  owner_id: string;
  created_at: string;
  videos: Video[];
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

// Fetch a single video by ID
export const fetchVideoById = async (videoId: string): Promise<Video> => {
  try {
    const token = getAccessToken();
    const response = await fetch(
      `${config.BASE_URL}${config.API_ENDPOINTS.VIDEOS}/${videoId}`,
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
        errorData.detail || `Failed to fetch video: ${response.statusText}`
      );
    }

    const data: Video = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching video:", error);
    throw error;
  }
};

// Fetch all playlists
export const fetchPlaylists = async (): Promise<Playlist[]> => {
  try {
    const token = getAccessToken();
    const response = await fetch(
      `${config.BASE_URL}${config.API_ENDPOINTS.PLAYLISTS}`,
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
        errorData.detail || `Failed to fetch playlists: ${response.statusText}`
      );
    }

    const data: Playlist[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching playlists:", error);
    throw error;
  }
};

// Add video via torrent/magnet link
export interface AddVideoPayload {
  magnet_link: string;
  torrent_name?: string;
}

export const addVideoFromTorrent = async (
  payload: AddVideoPayload
): Promise<{ status: string; message: string; queue_size: number }> => {
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
      const errorMessage = errorData.detail
        ? Array.isArray(errorData.detail)
          ? errorData.detail.map((e: any) => e.msg).join(", ")
          : errorData.detail
        : `Failed to add video: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
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
