import { useState, useEffect, useRef } from "react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import type { Video, Playlist } from "../api/videosApi";
import {
  fetchVideos,
  fetchPlaylists,
  searchVideos,
  updateVideo,
  deleteVideo,
  createPlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
} from "../api/videosApi";
import AddVideoModal from "./AddVideoModal";
import VideoPlayer from "./VideoPlayer";
import VideoThumbnail from "./VideoThumbnail";
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
    null,
  );
  const [statusFilter, setStatusFilter] = useState<Video["status"] | "ALL">(
    "ALL",
  );
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [contextMenuVideo, setContextMenuVideo] = useState<Video | null>(null);
  const [contextMenuPlaylist, setContextMenuPlaylist] =
    useState<Playlist | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [createPlaylistValue, setCreatePlaylistValue] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch videos and playlists on component mount
  useEffect(() => {
    loadContent();
  }, []);

  // Keyboard shortcut: Focus search on "/" key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Only trigger if not typing in an input/textarea
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  // Auto-refresh every 5 seconds when not watching video
  useEffect(() => {
    if (selectedVideoId) return; // Don't refresh when watching video

    const interval = setInterval(() => {
      loadContent(true); // Silent refresh
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedVideoId]);

  // Filter content when search query changes
  useEffect(() => {
    let videoResults = searchVideos(videos, searchQuery);

    // Apply status filter
    if (statusFilter !== "ALL") {
      videoResults = videoResults.filter(
        (video) => video.status === statusFilter,
      );
    }

    setFilteredVideos(videoResults);

    const playlistResults = playlists.filter((playlist) =>
      playlist.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredPlaylists(playlistResults);
  }, [searchQuery, videos, playlists, statusFilter]);

  const loadContent = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      const [videosData, playlistsData] = await Promise.all([
        fetchVideos(),
        fetchPlaylists(),
      ]);

      // Only update if data actually changed
      if (JSON.stringify(videosData) !== JSON.stringify(videos)) {
        setVideos(videosData);
        setFilteredVideos(videosData);
      }

      if (JSON.stringify(playlistsData) !== JSON.stringify(playlists)) {
        setPlaylists(playlistsData);
        setFilteredPlaylists(playlistsData);
      }
    } catch (err) {
      // Only show errors for manual refresh, ignore silent refresh errors
      if (!silent) {
        setError(err instanceof Error ? err.message : "Failed to load content");
      }
      // Silent refresh errors are completely ignored
    } finally {
      if (!silent) {
        setLoading(false);
      }
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

  // Get current user ID from localStorage
  const getCurrentUserId = (): string => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id;
    }
    return "";
  };

  // Check if user is guest
  const isGuestUser = (): boolean => {
    const username = localStorage.getItem("username");
    if (username) {
      return username.toLowerCase().includes("guest");
    }
    return false;
  };

  // Handle add torrent with guest check
  const handleAddTorrent = () => {
    if (isGuestUser()) {
      toast.error("Sorry Can't Allow That You will fill my server", {
        duration: 4000,
      });
      return;
    }
    setShowAddModal(true);
  };

  // Handle video rename
  const handleRenameVideo = async () => {
    if (!contextMenuVideo || !renameValue.trim()) return;

    try {
      await updateVideo(contextMenuVideo.id, { title: renameValue });
      toast.success("Video renamed successfully");
      setShowRenameModal(false);
      setContextMenuVideo(null);
      setRenameValue("");
      loadContent();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to rename video",
      );
    }
  };

  // Handle video delete
  const handleDeleteVideo = async (video: Video) => {
    if (!window.confirm(`Delete "${video.title}"? This cannot be undone.`))
      return;

    try {
      await deleteVideo(video.id);
      toast.success("Video deleted successfully");
      loadContent();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete video",
      );
    }
  };

  // Handle create playlist
  const handleCreatePlaylist = async () => {
    if (!createPlaylistValue.trim()) return;

    try {
      const userId = getCurrentUserId();
      await createPlaylist({
        title: createPlaylistValue,
        owner_id: userId,
      });
      toast.success("Playlist created successfully");
      setShowCreatePlaylistModal(false);
      setCreatePlaylistValue("");
      loadContent();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create playlist",
      );
    }
  };

  // Handle delete playlist
  const handleDeletePlaylist = async (playlist: Playlist) => {
    if (!window.confirm(`Delete "${playlist.title}"? This cannot be undone.`))
      return;

    try {
      await deletePlaylist(playlist.id);
      toast.success("Playlist deleted successfully");
      loadContent();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete playlist",
      );
    }
  };

  // Handle add video to playlist
  const handleAddToPlaylist = async (playlistId: string) => {
    if (!contextMenuVideo) return;

    try {
      await addVideoToPlaylist(playlistId, {
        video_id: contextMenuVideo.id,
      });
      toast.success("Video added to playlist");
      setShowAddToPlaylistModal(false);
      setContextMenuVideo(null);
      loadContent();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add video to playlist",
      );
    }
  };

  // Handle remove video from playlist
  const handleRemoveFromPlaylist = async (
    playlistId: string,
    videoId: string,
  ) => {
    if (!window.confirm("Remove this video from the playlist?")) return;

    try {
      await removeVideoFromPlaylist(playlistId, videoId);
      toast.success("Video removed from playlist");
      loadContent();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to remove video from playlist",
      );
    }
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
            <button className="btn-primary" onClick={() => loadContent()}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster />
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
                    ref={searchInputRef}
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
                  onClick={() => loadContent()}
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

                <button className="btn-primary" onClick={handleAddTorrent}>
                  Add
                </button>
                {activeTab === "playlists" && (
                  <button
                    className="btn-primary"
                    onClick={() => setShowCreatePlaylistModal(true)}
                    style={{ marginLeft: "0.5rem" }}
                  >
                    Create Playlist
                  </button>
                )}
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
                  <div key={video.id} className="content-card">
                    <div
                      className="card-thumbnail"
                      onClick={() => setSelectedVideoId(video.id)}
                    >
                      <VideoThumbnail
                        thumbnailUrl={
                          video.thumbnail_url || "/placeholder-thumbnail.jpg"
                        }
                        alt={video.title}
                        className="card-image"
                      />
                      <div className="card-badge">
                        <span
                          className={`card-badge ${getStatusStyles(
                            video.status,
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
                    <div className="card-info">
                      <h3 className="card-title">{video.title}</h3>
                      <button
                        className="card-menu-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setContextMenuVideo(video);
                        }}
                        title="More options"
                      >
                        ⋮
                      </button>
                    </div>
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
                    <div className="playlist-header">
                      <div
                        className="playlist-header-content"
                        onClick={() => togglePlaylist(playlist.id)}
                      >
                        <div className="playlist-thumbnail-small">
                          {playlist.videos.length > 0 ? (
                            <VideoThumbnail
                              thumbnailUrl={playlist.videos[0].thumbnail_url}
                              alt={playlist.title}
                              className="card-image"
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
                      <button
                        className="card-menu-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setContextMenuPlaylist(playlist);
                        }}
                        title="More options"
                      >
                        ⋮
                      </button>
                    </div>

                    {isExpanded && playlist.videos.length > 0 && (
                      <div className="playlist-videos">
                        <div className="playlist-videos-grid">
                          {playlist.videos.map((video) => (
                            <div key={video.id} className="playlist-video-item">
                              <div
                                className="playlist-video-thumbnail"
                                onClick={() => setSelectedVideoId(video.id)}
                              >
                                <VideoThumbnail
                                  thumbnailUrl={
                                    video.thumbnail_url ||
                                    "/placeholder-thumbnail.jpg"
                                  }
                                  alt={video.title}
                                  className="card-image"
                                />
                                <div className="card-badge">
                                  <span
                                    className={`playlist-video-status ${getStatusStyles(
                                      video.status,
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
                              <div className="playlist-video-info">
                                <h4 className="playlist-video-title">
                                  {video.title}
                                </h4>
                                <button
                                  className="remove-video-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFromPlaylist(
                                      playlist.id,
                                      video.id,
                                    );
                                  }}
                                  title="Remove from playlist"
                                >
                                  ✕
                                </button>
                              </div>
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
                                      video.height,
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

      {/* Video Context Menu */}
      {contextMenuVideo && (
        <div
          className="modal-overlay"
          onClick={() => setContextMenuVideo(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Video Options</h2>
              <button
                className="modal-close"
                onClick={() => setContextMenuVideo(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="context-menu">
                <button
                  className="context-menu-item"
                  onClick={() => {
                    setRenameValue(contextMenuVideo.title);
                    setShowRenameModal(true);
                    setContextMenuVideo(null);
                  }}
                >
                  Rename
                </button>
                <button
                  className="context-menu-item"
                  onClick={() => {
                    setShowAddToPlaylistModal(true);
                    setContextMenuVideo(contextMenuVideo);
                  }}
                >
                  Add to Playlist
                </button>
                <button
                  className="context-menu-item danger"
                  onClick={() => {
                    handleDeleteVideo(contextMenuVideo);
                    setContextMenuVideo(null);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Playlist Context Menu */}
      {contextMenuPlaylist && (
        <div
          className="modal-overlay"
          onClick={() => setContextMenuPlaylist(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Playlist Options</h2>
              <button
                className="modal-close"
                onClick={() => setContextMenuPlaylist(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="context-menu">
                <button
                  className="context-menu-item danger"
                  onClick={() => {
                    handleDeletePlaylist(contextMenuPlaylist);
                    setContextMenuPlaylist(null);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rename Video Modal */}
      {showRenameModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowRenameModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Rename Video</h2>
              <button
                className="modal-close"
                onClick={() => setShowRenameModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                className="modal-input"
                placeholder="Enter new title"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameVideo();
                }}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowRenameModal(false)}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={handleRenameVideo}>
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreatePlaylistModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreatePlaylistModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Playlist</h2>
              <button
                className="modal-close"
                onClick={() => setShowCreatePlaylistModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                className="modal-input"
                placeholder="Enter playlist title"
                value={createPlaylistValue}
                onChange={(e) => setCreatePlaylistValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreatePlaylist();
                }}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowCreatePlaylistModal(false)}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={handleCreatePlaylist}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Playlist Modal */}
      {showAddToPlaylistModal && contextMenuVideo && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddToPlaylistModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add to Playlist</h2>
              <button
                className="modal-close"
                onClick={() => setShowAddToPlaylistModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {playlists.length === 0 ? (
                <p className="text-muted">
                  No playlists available. Create one first.
                </p>
              ) : (
                <div className="playlist-select-list">
                  {playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      className="playlist-select-item"
                      onClick={() => handleAddToPlaylist(playlist.id)}
                    >
                      {playlist.title}
                      <span className="playlist-video-count">
                        {playlist.videos.length} videos
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
