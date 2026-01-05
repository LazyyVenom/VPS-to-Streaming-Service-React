import { useState } from "react";
import { addVideoFromTorrent } from "../api/videosApi";
import "./AddVideoModal.css";

interface AddVideoModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddVideoModal = ({ onClose, onSuccess }: AddVideoModalProps) => {
  const [torrentUrl, setTorrentUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateTorrentUrl = (url: string): boolean => {
    // Check for magnet link
    if (url.startsWith("magnet:?xt=urn:btih:")) {
      return true;
    }
    // Check for .torrent file URL
    if (url.match(/^https?:\/\/.+\.torrent$/i)) {
      return true;
    }
    // Check for general URL pattern that might be a torrent link
    if (url.match(/^https?:\/\/.+/i)) {
      return true;
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!torrentUrl.trim()) {
      setError("Please enter a torrent/magnet link");
      return;
    }

    if (!validateTorrentUrl(torrentUrl)) {
      setError("Please enter a valid torrent URL or magnet link");
      return;
    }

    try {
      setLoading(true);
      await addVideoFromTorrent({
        torrent_url: torrentUrl.trim(),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add video");
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Add Video</h2>
          <button
            className="close-button"
            onClick={onClose}
            type="button"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="add-video-form">
          <div className="form-group">
            <label htmlFor="torrent-url" className="form-label">
              Torrent / Magnet Link
            </label>
            <textarea
              id="torrent-url"
              className="form-textarea"
              placeholder="magnet:?xt=urn:btih:... or https://example.com/file.torrent"
              value={torrentUrl}
              onChange={(e) => setTorrentUrl(e.target.value)}
              disabled={loading}
            />
            <span className="form-hint">
              Paste a magnet link or torrent file URL. If link contains Multiple
              videos will be they will be saved as a playlist.
            </span>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Adding..." : "Add Video"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVideoModal;
