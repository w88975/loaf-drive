/**
 * 工具函数库
 * 功能：提供格式化、文件分类、多媒体处理等通用工具函数
 */

/**
 * 格式化文件大小
 * 功能：将字节数转换为人类可读的格式（B/KB/MB/GB/TB）
 * @param bytes 字节数
 * @returns 格式化后的字符串，如 "2.5 MB"
 */
export const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 格式化日期时间
 * 功能：将时间戳转换为易读的日期字符串
 * @param timestamp 毫秒级时间戳
 * @returns 格式化后的日期字符串，如 "Dec 23, 2025, 10:30 AM"
 */
export const formatDate = (timestamp: number): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp));
};

/**
 * 文件分类枚举
 * 功能：将文件按用途和格式分为7大类
 */
export type FileCategory = 'image' | 'video' | 'audio' | 'text' | 'pdf' | 'archive' | 'other';

/**
 * 根据扩展名判断文件类别
 * 功能：通过扩展名匹配返回文件所属分类，用于选择图标和预览器
 * @param extension 文件扩展名（不含点）
 * @returns 文件类别
 */
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

/**
 * 获取文件对应的图标名称
 * 功能：根据文件类型和扩展名返回 Icons 对象中的图标键名
 * @param type 文件类型（'file' | 'folder'）
 * @param extension 文件扩展名
 * @returns Icons 对象的键名
 */
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

/**
 * 生成随机ID
 * 功能：生成9位随机字符串，用于上传任务等临时标识
 * @returns 随机ID字符串
 */
export const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * 视频帧数据结构
 * 功能：存储视频截取的单帧信息
 * - uri: Base64 编码的图片数据
 * - time: 帧所在时间点（毫秒）
 * - ratio: 相对于视频总时长的比例 (0-1)
 */
export interface VideoFrame {
  uri: string;
  time: number;
  ratio: number;
}

/**
 * 客户端生成图片缩略图
 * 功能：在浏览器端使用 Canvas 将图片缩放为固定尺寸的缩略图
 * 采用 Cover 缩放模式（填充满画布，裁剪溢出部分）
 * @param imageUrl 原图 URL（支持跨域的图片）
 * @param width 缩略图宽度，默认 150px
 * @param height 缩略图高度，默认 150px
 * @returns Promise<Base64> - JPEG 格式的 Base64 数据 URL
 */
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

/**
 * 客户端提取视频多帧预览图（离线处理）
 * 功能：在浏览器端使用 Canvas 从视频文件中提取多个时间点的截图
 * 核心优势：所有处理在客户端完成，不消耗服务器算力
 * @param videoUrl 视频文件 URL（支持跨域）
 * @param ratios 截取时间点比例数组，范围 0-1，如 [0.1, 0.3, 0.5, 0.7, 0.9]
 * @returns Promise<VideoFrame[]> - 包含每帧 Base64 数据的数组
 * 
 * 工作流程：
 * 1. 创建隐藏的 video 元素加载视频
 * 2. 等待视频元数据加载完成获取总时长
 * 3. 遍历 ratios 数组，逐个 seek 到指定时间点
 * 4. 使用 Canvas 截取当前帧，采用 Contain 模式（保持比例，黑边填充）
 * 5. 将每帧转换为 JPEG Base64 格式
 */
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

/**
 * 将 Base64 Data URI 转换为 Blob 对象
 * 功能：用于将 Canvas 生成的 Base64 数据转换为可上传的二进制 Blob
 * @param dataURI Base64 格式的 Data URI（如 "data:image/jpeg;base64,/9j/4AAQ..."）
 * @returns Blob 对象，可直接用于 FormData 上传
 */
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
