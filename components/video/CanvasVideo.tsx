import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";

/**
 * CanvasVideo Component (HLS.js + Virtual Decoder Edition)
 *
 * Uses HLS.js for segmented loading and aggressive buffer cleanup.
 * Decodes into a hidden virtual video element and renders to Canvas.
 * Features: Full player controls with Geek-Brutalism UI style
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
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isDraggingProgress, setIsDraggingProgress] = useState(false);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const formatTime = (seconds: number): string => {
      if (!isFinite(seconds)) return "00:00";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePlayPause = () => {
      if (videoRef.current?.paused) {
        videoRef.current?.play();
      } else {
        videoRef.current?.pause();
      }
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!videoRef.current || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * duration;
      setCurrentTime(pos * duration);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      setVolume(newVolume);
      if (videoRef.current) {
        videoRef.current.volume = newVolume;
        videoRef.current.muted = newVolume === 0;
        setIsMuted(newVolume === 0);
      }
    };

    const toggleMute = () => {
      if (videoRef.current) {
        const newMuted = !isMuted;
        videoRef.current.muted = newMuted;
        setIsMuted(newMuted);
      }
    };

    const toggleFullscreen = () => {
      if (!containerRef.current) return;
      
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    };

    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000) as any;
      }
    };

    const cleanup = () => {
      cancelAnimationFrame(animationFrameRef.current);
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }

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
        video.muted = autoplay; // Muted only for autoplay
        video.playsInline = true;
        video.loop = loop;
        video.volume = volume;
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
          setShowControls(true);
          onPlay?.();
        };

        video.onpause = () => {
          setIsPlaying(false);
          setShowControls(true);
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
      
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };
      
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      
      return () => {
        cleanup();
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    }, [src]);

    useEffect(() => {
      if (!isPlaying) {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      }
    }, [isPlaying]);

    useEffect(() => {
      if (isLoaded) {
        setShowControls(true);
      }
    }, [isLoaded]);

    return (
      <div
        ref={containerRef}
        className={`relative flex items-center justify-center bg-black ${className}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setShowControls(true)}
      >
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain cursor-pointer"
          onClick={handlePlayPause}
        />
        
        {/* Debug Indicator - 调试指示器 */}
        {isLoaded && (
          <div className="absolute top-4 right-4 bg-yellow-400 border-2 border-black px-3 py-1 text-xs font-mono font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-20">
            Controls: {showControls ? 'VISIBLE' : 'HIDDEN'} | Playing: {isPlaying ? 'YES' : 'NO'}
          </div>
        )}
        
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="flex flex-col items-center gap-4 bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-12 h-12 border-4 border-black border-t-yellow-400 animate-spin"></div>
              <span className="text-[10px] uppercase tracking-widest text-black font-bold font-mono">
                Loading Video
              </span>
            </div>
          </div>
        )}

        {isLoaded && (
          <div 
            className={`absolute bottom-0 left-0 right-0 bg-white border-t-4 border-black transition-all duration-300 z-10 ${
              showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
            }`}
          >
            {/* Progress Bar */}
            <div 
              className="h-3 bg-gray-200 border-b-2 border-black cursor-pointer relative group"
              onClick={handleProgressClick}
              onMouseDown={() => setIsDraggingProgress(true)}
              onMouseUp={() => setIsDraggingProgress(false)}
            >
              <div 
                className="h-full bg-yellow-400 border-r-2 border-black transition-all"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-black border-2 border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${(currentTime / duration) * 100}%`, transform: 'translate(-50%, -50%)' }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 p-3">
              {/* Play/Pause Button */}
              <button
                onClick={handlePlayPause}
                className="w-10 h-10 flex items-center justify-center bg-white border-2 border-black hover:bg-yellow-400 active:scale-95 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" fill="black" />
                ) : (
                  <Play className="w-5 h-5" fill="black" />
                )}
              </button>

              {/* Time Display */}
              <div className="font-mono font-bold text-xs uppercase tracking-wider">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              <div className="flex-1" />

              {/* Volume Control */}
              <div className="flex items-center gap-2 group/volume">
                <button
                  onClick={toggleMute}
                  className="w-10 h-10 flex items-center justify-center bg-white border-2 border-black hover:bg-yellow-400 active:scale-95 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                <div className="w-0 group-hover/volume:w-24 overflow-hidden transition-all duration-200">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-2 bg-gray-200 border-2 border-black appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                      [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
                      [&::-webkit-slider-thumb]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-black 
                      [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:rounded-none
                      [&::-moz-range-thumb]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] [&::-moz-range-thumb]:cursor-pointer"
                  />
                </div>
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="w-10 h-10 flex items-center justify-center bg-white border-2 border-black hover:bg-yellow-400 active:scale-95 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5" />
                ) : (
                  <Maximize className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

CanvasVideo.displayName = "CanvasVideo";
export default CanvasVideo;
