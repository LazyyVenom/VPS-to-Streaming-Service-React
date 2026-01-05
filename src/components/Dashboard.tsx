import { useState, useEffect } from "react";
import type { Video } from "../api/videosApi";
import { fetchVideos, searchVideos } from "../api/videosApi";
import AddVideoModal from "./AddVideoModal";
import "./Dashboard.css";

const Dashboard = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch videos on component mount
  useEffect(() => {
    loadVideos();
  }, []);

  // Filter videos when search query changes
  useEffect(() => {
    const results = searchVideos(videos, searchQuery);
    setFilteredVideos(results);
  }, [searchQuery, videos]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchVideos();
      setVideos(data);
      setFilteredVideos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusClass = (status: Video["status"]) => {
    switch (status) {
      case "READY":
        return "status-ready";
      case "UPLOADING":
        return "status-uploading";
      case "PROCESSING":
        return "status-processing";
      case "FAILED":
        return "status-failed";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <h2>Loading videos...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button className="retry-button" onClick={loadVideos}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Watch : )</h1>
          <div className="header-actions">
            <button
              className="add-video-button"
              onClick={() => setShowAddModal(true)}
            >
              + Add Video
            </button>
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </div>

        {filteredVideos.length === 0 ? (
          <div className="no-results">
            {videos.length === 0 ? (
              <>
                <h3>No videos yet</h3>
                <p>Start by uploading your first video!</p>
              </>
            ) : (
              <>
                <h3>No results found</h3>
                <p>Try searching with different keywords</p>
              </>
            )}
          </div>
        ) : (
          <div className="videos-grid">
            {filteredVideos.map((video) => (
              <div key={video.id} className="video-card">
                <img
                  src={video.thumbnail_url || "/placeholder-thumbnail.jpg"}
                  alt={video.title}
                  className="video-thumbnail"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='180'%3E%3Crect fill='%23222' width='280' height='180'/%3E%3Ctext fill='%23999' font-size='18' font-family='Arial' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Thumbnail%3C/text%3E%3C/svg%3E";
                  }}
                />
                <div className="video-info">
                  <h3 className="video-title">{video.title}</h3>
                  <div className="video-meta">
                    <span>Created: {formatDate(video.created_at)}</span>
                    <span
                      className={`video-status ${getStatusClass(video.status)}`}
                    >
                      {video.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddVideoModal
          onClose={() => setShowAddModal(false)}
          onSuccess={loadVideos}
        />
      )}
    </>
  );
};

export default Dashboard;
