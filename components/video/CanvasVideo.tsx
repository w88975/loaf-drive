import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";

/**
 * CanvasVideo Component (HLS.js + Virtual Decoder Edition)
 *
 * Uses HLS.js for segmented loading and aggressive buffer cleanup.
 * Decodes into a hidden virtual video element and renders to Canvas.
 */

export interface CanvasVideoProps {
  src: string | File;
  autoplay?: boolean;
  loop?: boolean;
  className?: string;
  onReady?: (info: any) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  onProgress?: (currentTime: number, duration: number) => void;
}

export interface CanvasVideoRef {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
}

const CanvasVideo = forwardRef<CanvasVideoRef, CanvasVideoProps>(
  (props, ref) => {
    const {
      src,
      autoplay = false,
      loop = false,
      className = "",
      onReady,
      onPlay,
      onPause,
      onEnd,
      onError,
      onProgress,
    } = props;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<any>(null);
    const animationFrameRef = useRef<number>(0);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    useImperativeHandle(ref, () => ({
      play: () => videoRef.current?.play(),
      pause: () => videoRef.current?.pause(),
      seek: (time: number) => {
        if (videoRef.current) videoRef.current.currentTime = time;
      },
      currentTime: videoRef.current?.currentTime || 0,
      duration: videoRef.current?.duration || 0,
      isPlaying: !videoRef.current?.paused,
    }));

    const cleanup = () => {
      cancelAnimationFrame(animationFrameRef.current);

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
        videoRef.current = null;
      }

      setIsPlaying(false);
      setIsLoaded(false);
    };

    const renderLoop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && !video.paused) {
        const ctx = canvas.getContext("2d", {
          alpha: false,
          desynchronized: true,
        });
        if (ctx) {
          // Match canvas size to video metadata if needed
          if (
            canvas.width !== video.videoWidth ||
            canvas.height !== video.videoHeight
          ) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          setCurrentTime(video.currentTime);
          onProgress?.(video.currentTime, video.duration);
        }
      }
      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    const loadHlsScript = (): Promise<any> => {
      return new Promise((resolve, reject) => {
        if ((window as any).Hls) {
          resolve((window as any).Hls);
          return;
        }
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
        script.onload = () => resolve((window as any).Hls);
        script.onerror = () => reject(new Error("Failed to load HLS engine."));
        document.head.appendChild(script);
      });
    };

    const init = async () => {
      try {
        cleanup();
        const Hls = await loadHlsScript();

        const video = document.createElement("video");
        video.muted = true; // Auto-play support
        video.playsInline = true;
        video.loop = loop;
        videoRef.current = video;

        const isHls = typeof src === "string" && src.endsWith(".m3u8");

        if (isHls && Hls.isSupported()) {
          const hls = new Hls({
            // AGGRESSIVE MEMORY MANAGEMENT
            maxBufferLength: 10, // Only keep 10s of video ahead
            maxMaxBufferLength: 20,
            backBufferLength: 5, // Discard segments 5s behind current time
            maxBufferSize: 30 * 1000 * 1000, // Cap buffer at 30MB
            enableWorker: true, // Decouple from main thread
          });

          hls.loadSource(src as string);
          hls.attachMedia(video);
          hlsRef.current = hls;

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoaded(true);
            setDuration(video.duration);
            onReady?.({ duration: video.duration });
            if (autoplay) video.play();
          });

          hls.on(Hls.Events.ERROR, (_: any, data: any) => {
            if (data.fatal) onError?.(`HLS Fatal Error: ${data.type}`);
          });
        } else {
          // Fallback for direct MP4 or Local Files
          const url =
            src instanceof File ? URL.createObjectURL(src) : (src as string);
          video.src = url;

          video.onloadedmetadata = () => {
            setIsLoaded(true);
            setDuration(video.duration);
            onReady?.({ duration: video.duration });
            if (autoplay) video.play();
          };

          video.onerror = () => onError?.("Video loading failed.");
        }

        video.onplay = () => {
          setIsPlaying(true);
          onPlay?.();
        };

        video.onpause = () => {
          setIsPlaying(false);
          onPause?.();
        };

        video.onended = () => {
          onEnd?.();
        };

        animationFrameRef.current = requestAnimationFrame(renderLoop);
      } catch (err: any) {
        onError?.(err.message || "Initialization error.");
      }
    };

    useEffect(() => {
      init();
      return cleanup;
    }, [src]);

    return (
      <div
        className={`relative flex items-center justify-center bg-black overflow-hidden group/canvas ${className}`}
      >
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain cursor-pointer shadow-2xl"
          onClick={() =>
            videoRef.current?.paused
              ? videoRef.current?.play()
              : videoRef.current?.pause()
          }
        />
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#050505]/60 backdrop-blur-xl">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">
                Initializing Stream
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

CanvasVideo.displayName = "CanvasVideo";
export default CanvasVideo;
