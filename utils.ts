
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

export type FileCategory = 'image' | 'video' | 'audio' | 'text' | 'pdf' | 'archive' | 'other';

export const getFileCategory = (extension?: string): FileCategory => {
  const ext = extension?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) return 'image';
  if (['mp4', 'webm', 'ogg', 'mov', 'm4v'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'flac', 'aac', 'm4a', 'wma', 'ogg'].includes(ext)) return 'audio';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
  if (['txt', 'md', 'json', 'js', 'ts', 'tsx', 'jsx', 'css', 'html', 'py', 'java', 'c', 'cpp', 'rs', 'go', 'sh', 'yaml', 'xml', 'sql', 'toml', 'ini', 'env', 'gitignore'].includes(ext)) return 'text';
  return 'other';
};

export const getFileIcon = (type: string, extension?: string): keyof typeof import('./constants').Icons => {
  if (type === 'folder') return 'Folder';
  const category = getFileCategory(extension);
  if (category === 'image') return 'Image';
  if (category === 'video') return 'Video';
  if (category === 'audio') return 'Audio';
  if (category === 'text') return 'Code';
  if (category === 'pdf') return 'Pdf';
  if (category === 'archive') return 'Archive';
  return 'File';
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

export interface VideoFrame {
  uri: string;
  time: number;
  ratio: number;
}

export async function getImageThumbnailWeb(
  imageUrl: string,
  width: number = 150,
  height: number = 150
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context failed'));

      // Cover scaling
      const scale = Math.max(width / img.width, height / img.height);
      const x = (width / 2) - (img.width / 2) * scale;
      const y = (height / 2) - (img.height / 2) * scale;
      
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => reject(new Error('Failed to load image for thumbnail'));
    img.src = imageUrl;
  });
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
