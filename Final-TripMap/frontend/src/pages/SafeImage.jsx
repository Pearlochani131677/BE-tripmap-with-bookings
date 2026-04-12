import React, { useState } from "react";

export default function SafeImage({ src, alt, className }) {
  const [error, setError] = useState(false);

  const fallback =
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400";

  return (
    <img
      src={!error && src ? src : fallback}
      alt={alt}
      loading="lazy"
      onError={() => setError(true)}
      className={className}
    />
  );
}
