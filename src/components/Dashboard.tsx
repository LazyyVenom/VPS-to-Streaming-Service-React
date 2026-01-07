import { useState, useEffect } from "react";
import type { Video, Playlist } from "../api/videosApi";
import { fetchVideos, fetchPlaylists, searchVideos } from "../api/videosApi";
import AddVideoModal from "./AddVideoModal";
import VideoPlayer from "./VideoPlayer";
import "./Dashboard.css";

const Dashboard = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [filteredPlaylists, setFilteredPlaylists] = useState<Playlist[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"videos" | "playlists">("videos");
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<Video["status"] | "ALL">(
    "ALL"
  );
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  // Fetch videos and playlists on component mount
  useEffect(() => {
    loadContent();
  }, []);

  // Filter content when search query changes
  useEffect(() => {
    let videoResults = searchVideos(videos, searchQuery);

    // Apply status filter
    if (statusFilter !== "ALL") {
      videoResults = videoResults.filter(
        (video) => video.status === statusFilter
      );
    }

    setFilteredVideos(videoResults);

    const playlistResults = playlists.filter((playlist) =>
      playlist.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPlaylists(playlistResults);
  }, [searchQuery, videos, playlists, statusFilter]);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const [videosData, playlistsData] = await Promise.all([
        fetchVideos(),
        fetchPlaylists(),
      ]);
      setVideos(videosData);
      setFilteredVideos(videosData);
      setPlaylists(playlistsData);
      setFilteredPlaylists(playlistsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load content");
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

  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return "—";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "—";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatResolution = (width: number, height: number): string => {
    if (width === 0 || height === 0) return "—";
    return `${width}×${height}`;
  };

  const getStatusStyles = (status: Video["status"]) => {
    switch (status) {
      case "READY":
        return "status-ready";
      case "UPLOADING":
        return "status-uploading";
      case "DOWNLOADING":
        return "status-downloading";
      case "PROCESSING":
        return "status-processing";
      case "PROCESSED":
        return "status-processed";
      case "FAILED":
        return "status-failed";
      default:
        return "";
    }
  };

  const togglePlaylist = (playlistId: string) => {
    setExpandedPlaylistId((prev) => (prev === playlistId ? null : playlistId));
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <div className="loading-content">
            <div className="spinner"></div>
            <p className="loading-text">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error-container">
          <div className="error-content">
            <div className="error-icon">
              <span>⚠️</span>
            </div>
            <p className="error-message">{error}</p>
            <button className="btn-primary" onClick={loadContent}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div className="dashboard-header-content">
            <div className="dashboard-header-inner">
              <h1 className="dashboard-title">Library</h1>

              <div className="dashboard-controls">
                <div className="search-container">
                  <svg
                    className="search-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>

                {activeTab === "videos" && (
                  <div className="status-filter">
                    <button
                      className="status-filter-button"
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    >
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                        />
                      </svg>
                      {statusFilter === "ALL" ? "All Status" : statusFilter}
                    </button>
                    {showStatusDropdown && (
                      <div className="status-filter-dropdown">
                        <div
                          className={`status-filter-option ${
                            statusFilter === "ALL" ? "active" : ""
                          }`}
                          onClick={() => {
                            setStatusFilter("ALL");
                            setShowStatusDropdown(false);
                          }}
                        >
                          All Status
                        </div>
                        <div
                          className={`status-filter-option ${
                            statusFilter === "PROCESSED" ? "active" : ""
                          }`}
                          onClick={() => {
                            setStatusFilter("PROCESSED");
                            setShowStatusDropdown(false);
                          }}
                        >
                          Processed
                          <span className="status-filter-badge status-processed">
                            PROCESSED
                          </span>
                        </div>
                        <div
                          className={`status-filter-option ${
                            statusFilter === "DOWNLOADING" ? "active" : ""
                          }`}
                          onClick={() => {
                            setStatusFilter("DOWNLOADING");
                            setShowStatusDropdown(false);
                          }}
                        >
                          Downloading
                          <span className="status-filter-badge status-downloading">
                            DOWNLOADING
                          </span>
                        </div>
                        <div
                          className={`status-filter-option ${
                            statusFilter === "PROCESSING" ? "active" : ""
                          }`}
                          onClick={() => {
                            setStatusFilter("PROCESSING");
                            setShowStatusDropdown(false);
                          }}
                        >
                          Processing
                          <span className="status-filter-badge status-processing">
                            PROCESSING
                          </span>
                        </div>
                        <div
                          className={`status-filter-option ${
                            statusFilter === "FAILED" ? "active" : ""
                          }`}
                          onClick={() => {
                            setStatusFilter("FAILED");
                            setShowStatusDropdown(false);
                          }}
                        >
                          Failed
                          <span className="status-filter-badge status-failed">
                            FAILED
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  className="icon-button"
                  onClick={loadContent}
                  disabled={loading}
                  title="Refresh"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>

                <button
                  className="btn-primary"
                  onClick={() => setShowAddModal(true)}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="dashboard-content">
          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab-button ${activeTab === "videos" ? "active" : ""}`}
              onClick={() => setActiveTab("videos")}
            >
              Videos
              {activeTab === "videos" && <div className="tab-indicator" />}
            </button>
            <button
              className={`tab-button ${
                activeTab === "playlists" ? "active" : ""
              }`}
              onClick={() => setActiveTab("playlists")}
            >
              Playlists
              {activeTab === "playlists" && <div className="tab-indicator" />}
            </button>
          </div>

          {/* Content Grid */}
          {activeTab === "videos" ? (
            filteredVideos.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="empty-title">
                  {videos.length === 0 ? "No videos yet" : "No results found"}
                </h3>
                <p className="empty-description">
                  {videos.length === 0
                    ? "Start building your library by adding your first video"
                    : "Try adjusting your search terms"}
                </p>
              </div>
            ) : (
              <div className="content-grid">
                {filteredVideos.map((video) => (
                  <div
                    key={video.id}
                    className="content-card"
                    onClick={() => setSelectedVideoId(video.id)}
                  >
                    <div className="card-thumbnail">
                      <img
                        src={
                          video.thumbnail_url || "/placeholder-thumbnail.jpg"
                        }
                        alt={video.title}
                        className="card-image"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Crect fill='%23f4f4f5' width='320' height='180'/%3E%3Ctext fill='%23a1a1aa' font-size='14' font-family='Arial' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Preview%3C/text%3E%3C/svg%3E";
                        }}
                      />
                      <div className="card-badge">
                        <span
                          className={`card-badge ${getStatusStyles(
                            video.status
                          )}`}
                        >
                          {video.status}
                        </span>
                      </div>
                      {video.duration_seconds > 0 && (
                        <div className="card-badge-bottom">
                          <span>{formatDuration(video.duration_seconds)}</span>
                        </div>
                      )}
                    </div>
                    <h3 className="card-title">{video.title}</h3>
                    <div className="card-meta">
                      <span className="card-date">
                        {formatDate(video.created_at)}
                      </span>
                      {video.size_bytes > 0 && (
                        <>
                          <span>•</span>
                          <span>{formatFileSize(video.size_bytes)}</span>
                        </>
                      )}
                      {(video.width > 0 || video.height > 0) && (
                        <>
                          <span>•</span>
                          <span>
                            {formatResolution(video.width, video.height)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : filteredPlaylists.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="empty-title">
                {playlists.length === 0
                  ? "No playlists yet"
                  : "No results found"}
              </h3>
              <p className="empty-description">
                {playlists.length === 0
                  ? "Organize your videos by creating playlists"
                  : "Try adjusting your search terms"}
              </p>
            </div>
          ) : (
            <div className="content-grid">
              {filteredPlaylists.map((playlist) => {
                const isExpanded = expandedPlaylistId === playlist.id;
                return (
                  <div
                    key={playlist.id}
                    className={`playlist-card ${isExpanded ? "expanded" : ""}`}
                  >
                    <div
                      className="playlist-header"
                      onClick={() => togglePlaylist(playlist.id)}
                    >
                      <div className="playlist-thumbnail-small">
                        {playlist.videos.length > 0 ? (
                          <img
                            src={playlist.videos[0].thumbnail_url}
                            alt={playlist.title}
                            className="card-image"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Crect fill='%23f4f4f5' width='320' height='180'/%3E%3Ctext fill='%23a1a1aa' font-size='14' font-family='Arial' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EPlaylist%3C/text%3E%3C/svg%3E";
                            }}
                          />
                        ) : (
                          <div className="empty-playlist-icon">
                            <svg
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="playlist-info">
                        <h3 className="playlist-title">{playlist.title}</h3>
                        <div className="playlist-meta">
                          <span>{playlist.videos.length} videos</span>
                          <span>•</span>
                          <span>{formatDate(playlist.created_at)}</span>
                        </div>
                      </div>
                      <svg
                        className={`expand-icon ${
                          isExpanded ? "expanded" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>

                    {isExpanded && playlist.videos.length > 0 && (
                      <div className="playlist-videos">
                        <div className="playlist-videos-grid">
                          {playlist.videos.map((video) => (
                            <div
                              key={video.id}
                              className="playlist-video-item"
                              onClick={() => setSelectedVideoId(video.id)}
                            >
                              <div className="playlist-video-thumbnail">
                                <img
                                  src={
                                    video.thumbnail_url ||
                                    "/placeholder-thumbnail.jpg"
                                  }
                                  alt={video.title}
                                  className="card-image"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Crect fill='%23f4f4f5' width='320' height='180'/%3E%3Ctext fill='%23a1a1aa' font-size='14' font-family='Arial' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Preview%3C/text%3E%3C/svg%3E";
                                  }}
                                />
                                <div className="card-badge">
                                  <span
                                    className={`playlist-video-status ${getStatusStyles(
                                      video.status
                                    )}`}
                                  >
                                    {video.status}
                                  </span>
                                </div>
                                {video.duration_seconds > 0 && (
                                  <div className="card-badge-bottom">
                                    <span>
                                      {formatDuration(video.duration_seconds)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <h4 className="playlist-video-title">
                                {video.title}
                              </h4>
                              <div className="playlist-video-meta">
                                {video.size_bytes > 0 && (
                                  <span>
                                    {formatFileSize(video.size_bytes)}
                                  </span>
                                )}
                                {video.size_bytes > 0 &&
                                  (video.width > 0 || video.height > 0) && (
                                    <span>•</span>
                                  )}
                                {(video.width > 0 || video.height > 0) && (
                                  <span>
                                    {formatResolution(
                                      video.width,
                                      video.height
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddVideoModal
          onClose={() => setShowAddModal(false)}
          onSuccess={loadContent}
        />
      )}

      {selectedVideoId && (
        <VideoPlayer
          videoId={selectedVideoId}
          onClose={() => setSelectedVideoId(null)}
        />
      )}
    </>
  );
};

export default Dashboard;
