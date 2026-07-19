export function VideoThumbnailFrame({ uri, onError }: { uri: string; onError: () => void }) {
  return (
    <video
      aria-hidden
      muted
      playsInline
      preload="metadata"
      src={uri}
      onError={onError}
      onLoadedMetadata={(event) => {
        const video = event.currentTarget;
        if (Number.isFinite(video.duration) && video.duration > 0) {
          video.currentTime = Math.min(0.1, video.duration / 2);
        }
      }}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      }}
    />
  );
}
