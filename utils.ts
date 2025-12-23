
export const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (timestamp: number): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp));
};

export const getFileIcon = (type: string, extension?: string) => {
  if (type === 'folder') return 'folder';
  const ext = extension?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'image';
  if (['mp4', 'webm', 'ogg', 'mov'].includes(ext || '')) return 'video';
  return 'file';
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

export interface VideoFrame {
  uri: string;
  time: number;
  ratio: number;
}

export async function getVideoFramesWeb(
  videoUrl: string,
  ratios: number[]
): Promise<VideoFrame[]> {
  const video = document.createElement('video');
  video.src = videoUrl;
  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.playsInline = true;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = (e) => reject(e);
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas 2d context');
  }

  const size = 350;
  canvas.width = size;
  canvas.height = size;

  const duration = video.duration * 1000;
  const frames: VideoFrame[] = [];

  for (const ratio of ratios) {
    const timeMs = Math.floor(duration * ratio);
    video.currentTime = timeMs / 1000;

    await new Promise<void>((resolve) => {
      const seekHandler = () => {
        video.removeEventListener('seeked', seekHandler);
        resolve();
      };
      video.addEventListener('seeked', seekHandler);
      setTimeout(() => {
        video.removeEventListener('seeked', seekHandler);
        resolve();
      }, 1000);
    });

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);

    const scale = Math.min(size / video.videoWidth, size / video.videoHeight);
    const x = (size - video.videoWidth * scale) / 2;
    const y = (size - video.videoHeight * scale) / 2;

    ctx.drawImage(
      video,
      0,
      0,
      video.videoWidth,
      video.videoHeight,
      x,
      y,
      video.videoWidth * scale,
      video.videoHeight * scale
    );

    const uri = canvas.toDataURL('image/jpeg', 0.8);

    frames.push({
      uri,
      time: timeMs,
      ratio,
    });
  }

  return frames;
}

export const dataURItoBlob = (dataURI: string) => {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};
