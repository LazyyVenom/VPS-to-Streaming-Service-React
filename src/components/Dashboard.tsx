import { useState, useEffect } from "react";
import type { Video, Playlist } from "../api/videosApi";
import { fetchVideos, fetchPlaylists, searchVideos } from "../api/videosApi";
import AddVideoModal from "./AddVideoModal";

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

  // Fetch videos and playlists on component mount
  useEffect(() => {
    loadContent();
  }, []);

  // Filter content when search query changes
  useEffect(() => {
    const videoResults = searchVideos(videos, searchQuery);
    setFilteredVideos(videoResults);

    const playlistResults = playlists.filter((playlist) =>
      playlist.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPlaylists(playlistResults);
  }, [searchQuery, videos, playlists]);

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

  const getStatusStyles = (status: Video["status"]) => {
    switch (status) {
      case "READY":
        return "bg-green-500/20 text-green-400 border border-green-400";
      case "UPLOADING":
        return "bg-orange-500/20 text-orange-400 border border-orange-400";
      case "PROCESSING":
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-400";
      case "FAILED":
        return "bg-red-500/20 text-red-400 border border-red-400";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#141414] to-black text-white p-5">
        <div className="flex justify-center items-center min-h-[400px] text-xl text-gray-400">
          <h2>Loading content...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#141414] to-black text-white p-5">
        <div className="flex flex-col justify-center items-center min-h-[400px] text-xl text-gray-400 gap-5">
          <p className="text-netflix-red font-semibold">{error}</p>
          <button
            className="px-8 py-3 bg-netflix-red text-white rounded-md text-base font-semibold cursor-pointer transition-all hover:bg-netflix-red-dark"
            onClick={loadContent}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-[#141414] to-black text-white p-5">
        <div className="flex justify-between items-center py-5 mb-8 flex-wrap gap-5">
          <h1 className="text-4xl font-bold m-0 text-netflix-red">Watch : )</h1>
          <div className="flex gap-4 items-center flex-wrap">
            <button
              className="px-6 py-3 bg-netflix-red text-white rounded-lg text-base font-semibold cursor-pointer transition-all hover:bg-netflix-red-dark hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(229,9,20,0.4)] whitespace-nowrap"
              onClick={() => setShowAddModal(true)}
            >
              + Add Video
            </button>
            <button
              className="px-6 py-3 bg-transparent text-white border-2 border-gray-600 rounded-lg text-base font-semibold cursor-pointer transition-all hover:border-white hover:bg-white/10 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              onClick={loadContent}
              disabled={loading}
              title="Refresh content"
            >
              🔄 Refresh
            </button>
            <div className="relative max-w-md w-full min-w-[250px]">
              <input
                type="text"
                className="w-full px-5 py-3 text-base border-2 border-gray-700 rounded-full bg-black/70 text-white transition-all outline-none focus:border-netflix-red focus:bg-black/90 placeholder:text-gray-500"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 mb-8 border-b-2 border-gray-700 pb-0">
          <button
            className={`px-6 py-3 bg-transparent border-none border-b-[3px] text-base font-semibold cursor-pointer transition-all relative -bottom-0.5 ${
              activeTab === "videos"
                ? "text-netflix-red border-b-netflix-red"
                : "text-gray-400 border-b-transparent hover:text-white"
            }`}
            onClick={() => setActiveTab("videos")}
          >
            Videos ({filteredVideos.length})
          </button>
          <button
            className={`px-6 py-3 bg-transparent border-none border-b-[3px] text-base font-semibold cursor-pointer transition-all relative -bottom-0.5 ${
              activeTab === "playlists"
                ? "text-netflix-red border-b-netflix-red"
                : "text-gray-400 border-b-transparent hover:text-white"
            }`}
            onClick={() => setActiveTab("playlists")}
          >
            Playlists ({filteredPlaylists.length})
          </button>
        </div>

        {activeTab === "videos" ? (
          filteredVideos.length === 0 ? (
            <div className="text-center py-16 px-5 text-gray-400">
              {videos.length === 0 ? (
                <>
                  <h3 className="text-2xl mb-2.5">No videos yet</h3>
                  <p className="text-base">
                    Start by uploading your first video!
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-2xl mb-2.5">No results found</h3>
                  <p className="text-base">
                    Try searching with different keywords
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-8 py-5">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  className="bg-[#1e1e1e]/80 rounded-xl overflow-hidden transition-all cursor-pointer hover:-translate-y-2.5 hover:shadow-[0_10px_30px_rgba(229,9,20,0.3)]"
                >
                  <img
                    src={video.thumbnail_url || "/placeholder-thumbnail.jpg"}
                    alt={video.title}
                    className="w-full h-[180px] object-cover bg-[#222] block"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='180'%3E%3Crect fill='%23222' width='280' height='180'/%3E%3Ctext fill='%23999' font-size='18' font-family='Arial' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Thumbnail%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold m-0 mb-2.5 text-white line-clamp-2">
                      {video.title}
                    </h3>
                    <div className="flex flex-col gap-1 text-sm text-gray-400">
                      <span>Created: {formatDate(video.created_at)}</span>
                      <span
                        className={`inline-block px-2.5 py-1 rounded-xl text-xs font-semibold uppercase mt-1 ${getStatusStyles(
                          video.status
                        )}`}
                      >
                        {video.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filteredPlaylists.length === 0 ? (
          <div className="text-center py-16 px-5 text-gray-400">
            {playlists.length === 0 ? (
              <>
                <h3 className="text-2xl mb-2.5">No playlists yet</h3>
                <p className="text-base">Create your first playlist!</p>
              </>
            ) : (
              <>
                <h3 className="text-2xl mb-2.5">No results found</h3>
                <p className="text-base">
                  Try searching with different keywords
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-8 py-5">
            {filteredPlaylists.map((playlist) => (
              <div
                key={playlist.id}
                className="bg-[#1e1e1e]/80 rounded-xl overflow-hidden transition-all cursor-pointer hover:-translate-y-2.5 hover:shadow-[0_10px_30px_rgba(229,9,20,0.3)]"
              >
                <div className="w-full h-[180px] relative bg-[#222]">
                  {playlist.videos.length > 0 ? (
                    <img
                      src={playlist.videos[0].thumbnail_url}
                      alt={playlist.title}
                      className="w-full h-full object-cover block"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='180'%3E%3Crect fill='%23222' width='280' height='180'/%3E%3Ctext fill='%23999' font-size='18' font-family='Arial' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EPlaylist%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a]">
                      <span className="text-6xl opacity-50">📋</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 flex items-center justify-between">
                    <span className="text-white text-sm font-semibold">
                      {playlist.videos.length} videos
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold m-0 mb-2.5 text-white line-clamp-2">
                    {playlist.title}
                  </h3>
                  <div className="flex flex-col gap-1 text-sm text-gray-400">
                    <span>Created: {formatDate(playlist.created_at)}</span>
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
          onSuccess={loadContent}
        />
      )}
    </>
  );
};

export default Dashboard;
