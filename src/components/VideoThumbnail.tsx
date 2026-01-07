import { useEffect, useState } from "react";

interface VideoThumbnailProps {
  thumbnailUrl: string;
  alt: string;
  className?: string;
  onError?: () => void;
}

function VideoThumbnail({
  thumbnailUrl,
  alt,
  className,
  onError,
}: VideoThumbnailProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!thumbnailUrl) {
      setError(true);
      return;
    }

    const token = localStorage.getItem("access_token");

    fetch(thumbnailUrl, {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load thumbnail");
        return res.blob();
      })
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch((err) => {
        console.error("Thumbnail load error:", err);
        setError(true);
        onError?.();
      });

    return () => {
      // Clean up object URL to prevent memory leaks
      if (src) {
        URL.revokeObjectURL(src);
      }
    };
  }, [thumbnailUrl]);

  if (error || !src) {
    return (
      <div
        className={className}
        style={{
          width: "100%",
          height: "100%",
          background: "#f4f4f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#a1a1aa",
          fontSize: "14px",
        }}
      >
        No Preview
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} />;
}

export default VideoThumbnail;
