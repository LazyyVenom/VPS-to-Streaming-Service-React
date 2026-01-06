import { useState } from "react";
import { addVideoFromTorrent } from "../api/videosApi";

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
    <div
      className="fixed inset-0 bg-black/85 flex justify-center items-center z-[1000] animate-[fadeIn_0.3s_ease]"
      onClick={handleOverlayClick}
    >
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border-2 border-gray-700 rounded-2xl p-10 max-w-[500px] w-[90%] shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-[slideUp_0.3s_ease] relative">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-netflix-red m-0">Add Video</h2>
          <button
            className="bg-transparent border-none text-gray-400 text-3xl cursor-pointer transition-colors p-0 w-9 h-9 flex items-center justify-center rounded-full hover:text-white hover:bg-white/10"
            onClick={onClose}
            type="button"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="torrent-url"
              className="text-[0.95rem] font-semibold text-white mb-1"
            >
              Torrent / Magnet Link
            </label>
            <textarea
              id="torrent-url"
              className="px-4 py-3 text-base border-2 border-gray-700 rounded-lg bg-black/50 text-white transition-all outline-none min-h-[100px] resize-y font-[inherit] focus:border-netflix-red focus:bg-black/70 placeholder:text-gray-600"
              placeholder="magnet:?xt=urn:btih:... or https://example.com/file.torrent"
              value={torrentUrl}
              onChange={(e) => setTorrentUrl(e.target.value)}
              disabled={loading}
            />
            <span className="text-sm text-gray-400 mt-1">
              Paste a magnet link or torrent file URL. If link contains Multiple
              videos will be they will be saved as a playlist.
            </span>
          </div>

          <div className="flex gap-4 mt-4">
            <button
              type="button"
              className="flex-1 px-5 py-3 text-base font-semibold border-none rounded-lg cursor-pointer transition-all bg-transparent text-white border-2 border-gray-600 hover:border-white hover:bg-white/10"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-5 py-3 text-base font-semibold border-none rounded-lg cursor-pointer transition-all bg-netflix-red text-white hover:bg-netflix-red-dark hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(229,9,20,0.4)] disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Video"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVideoModal;
