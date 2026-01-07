import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import type { Video } from "../api/videosApi";
import { fetchVideoById } from "../api/videosApi";
import "./VideoPlayer.css";

interface VideoPlayerProps {
  videoId: string;
  onClose: () => void;
}

const VideoPlayer = ({ videoId, onClose }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qualities, setQualities] = useState<
    { level: number; height: number; label: string }[]
  >([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  useEffect(() => {
    const loadVideo = async () => {
      try {
        setLoading(true);
        setError(null);
        const videoData = await fetchVideoById(videoId);
        setVideo(videoData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load video");
      } finally {
        setLoading(false);
      }
    };

    loadVideo();
  }, [videoId]);

  useEffect(() => {
    if (!videoRef.current || !video || video.status !== "PROCESSED") return;

    const videoElement = videoRef.current;
    const token = localStorage.getItem("access_token");

    // Check if HLS is supported
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        xhrSetup: function (xhr) {
          if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          }
        },
      });

      hls.loadSource(video.storage_path);
      hls.attachMedia(videoElement);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Video is ready to play
        console.log("HLS manifest loaded");

        // Get available quality levels
        const levels = hls.levels.map((level, index) => ({
          level: index,
          height: level.height,
          label: `${level.height}p`,
        }));
        setQualities(levels);
        setCurrentQuality(-1); // -1 means auto
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        console.log("Quality switched to level:", data.level);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error("HLS error:", data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error("Fatal network error, trying to recover");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error("Fatal media error, trying to recover");
              hls.recoverMediaError();
              break;
            default:
              console.error("Fatal error, cannot recover");
              setError("Failed to load video stream");
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
      // For Safari (native HLS support)
      // Note: Safari native HLS doesn't support custom headers for segments
      // You may need to handle auth differently for Safari (e.g., token in URL)
      videoElement.src = video.storage_path;
    } else {
      setError("HLS is not supported in this browser");
    }

    // Cleanup
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [video]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleQualityChange = (level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
      setCurrentQuality(level);
      setShowQualityMenu(false);
    }
  };

  const getQualityLabel = () => {
    if (currentQuality === -1) return "Auto";
    const quality = qualities.find((q) => q.level === currentQuality);
    return quality ? quality.label : "Auto";
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

  return (
    <div className="video-player-modal" onClick={handleOverlayClick}>
      <div className="video-player-container">
        <div className="video-player-header">
          <h2 className="video-player-title">
            {loading ? "Loading..." : video?.title || "Video"}
          </h2>
          <button
            className="video-player-close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="video-player-content">
          {loading ? (
            <div className="video-player-loading">
              <div className="spinner"></div>
              <p>Loading video...</p>
            </div>
          ) : error ? (
            <div className="video-player-error">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
            </div>
          ) : video?.status !== "PROCESSED" ? (
            <div className="video-player-error">
              <div className="error-icon">⏳</div>
              <p>Video is still being processed</p>
              <p className="video-status-text">Status: {video?.status}</p>
            </div>
          ) : (
            <>
              <div className="video-player-wrapper">
                <video
                  ref={videoRef}
                  className="video-player"
                  controls
                  autoPlay={false}
                  playsInline
                />

                {qualities.length > 0 && (
                  <div className="quality-selector">
                    <button
                      className="quality-button"
                      onClick={() => setShowQualityMenu(!showQualityMenu)}
                    >
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>{getQualityLabel()}</span>
                    </button>

                    {showQualityMenu && (
                      <div className="quality-menu">
                        <div
                          className={`quality-option ${
                            currentQuality === -1 ? "active" : ""
                          }`}
                          onClick={() => handleQualityChange(-1)}
                        >
                          <span>Auto</span>
                          {currentQuality === -1 && (
                            <span className="check">✓</span>
                          )}
                        </div>
                        {qualities.map((quality) => (
                          <div
                            key={quality.level}
                            className={`quality-option ${
                              currentQuality === quality.level ? "active" : ""
                            }`}
                            onClick={() => handleQualityChange(quality.level)}
                          >
                            <span>{quality.label}</span>
                            {currentQuality === quality.level && (
                              <span className="check">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {video && (
                <div className="video-player-info">
                  <div className="video-info-row">
                    {video.duration_seconds > 0 && (
                      <span>
                        Duration: {formatDuration(video.duration_seconds)}
                      </span>
                    )}
                    {video.size_bytes > 0 && (
                      <span>Size: {formatFileSize(video.size_bytes)}</span>
                    )}
                    {(video.width > 0 || video.height > 0) && (
                      <span>
                        Resolution:{" "}
                        {formatResolution(video.width, video.height)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
