import { useState } from "react";
import toast from "react-hot-toast";
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
        magnet_link: torrentUrl.trim(),
      });
      toast.success(
        "Your torrent has been queued! Once downloading starts you can see it in the dashboard.",
        {
          duration: 5000,
          position: "top-center",
        }
      );
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
    <div className="modal-backdrop" onClick={handleOverlayClick}>
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">Add Content</h2>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label htmlFor="torrent-url" className="form-label">
                Torrent or Magnet Link
              </label>
              <textarea
                id="torrent-url"
                className="form-textarea"
                placeholder="magnet:?xt=urn:btih:... or https://example.com/file.torrent"
                value={torrentUrl}
                onChange={(e) => setTorrentUrl(e.target.value)}
                disabled={loading}
              />
              <p className="form-hint">
                Multiple videos will be automatically organized into a playlist
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Adding..." : "Add"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddVideoModal;
