import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  RotateCcw, RotateCw, Settings, Subtitles, Languages,
  ChevronLeft, ChevronRight, List, Flag
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getMovieById } from "@/data/movies";
import { getProxiedUrl } from "@/lib/image-proxy";

const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const PlayerPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const season = searchParams.get("season") || "1";
  const episode = searchParams.get("episode") || "1";

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const playerInstance = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [quality, setQuality] = useState("auto");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [qualities, setQualities] = useState<any[]>([]);
  const [audioTracks, setAudioTracks] = useState<any[]>([]);
  const [subtitleTracks, setSubtitleTracks] = useState<any[]>([]);
  const [currentAudio, setCurrentAudio] = useState<number>(-1);
  const [currentSub, setCurrentSub] = useState<number>(-1);
  const [isMarathonMode, setIsMarathonMode] = useState(false);
  const isMarathonModeRef = useRef(false);
  useEffect(() => {
    isMarathonModeRef.current = isMarathonMode;
  }, [isMarathonMode]);

  const [isAudioMenuOpen, setIsAudioMenuOpen] = useState(false);
  const [isEpisodesOpen, setIsEpisodesOpen] = useState(false);

  const [streamData, setStreamData] = useState<{ title: string; streamUrl: string; logo?: string; isTV?: boolean } | null>(null);
  const movie = id ? getMovieById(id) : null;
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (movie) {
      setStreamData({
        title: movie.title,
        streamUrl: movie.streamUrl || "",
        logo: movie.image,
        isTV: false
      });
    } else if (id) {
      fetch('/api/channels')
        .then(res => res.json())
        .then(data => {
          const channel = data.find((c: any) => c.id.toString() === id);
          if (channel) {
            setStreamData({
              title: channel.title,
              streamUrl: channel.streamUrl,
              logo: channel.logo,
              isTV: true
            });
          }
        });
    }
  }, [id, movie]);

  const currentMovieData = useMemo(() => ({
    title: streamData?.title || "Загрузка...",
    season: parseInt(season),
    episode: parseInt(episode),
    streamUrl: streamData?.streamUrl || ""
  }), [streamData?.title, season, episode, streamData?.streamUrl]);

  const loadScript = (id: string, url: string): Promise<void> => {
    return new Promise((resolve) => {
      if (document.getElementById(id)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.id = id;
      script.src = url;
      script.async = true;
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  };

  useEffect(() => {
    let isMounted = true;

    const initPlayer = async () => {
      await loadScript('hls-js', 'https://cdn.jsdelivr.net/npm/hls.js@latest');
      await loadScript('player-core-js', '/assets/js/player-core.js');

      if (isMounted && videoRef.current && window.ProVideoPlayer && currentMovieData.streamUrl) {
        if (playerInstance.current) {
          playerInstance.current.destroy();
        }

        playerInstance.current = new window.ProVideoPlayer({
          videoElement: videoRef.current,
          autoplay: true,
          onError: (err: any) => {
            if (err.details !== 'bufferStalledError') {
              setError("Ошибка загрузки видео");
            }
          }
        });

        // Загружаем source НАПРЯМУЮ без proxy для максимальной совместимости
        console.log('[PlayerPage] Loading source:', currentMovieData.streamUrl);
        playerInstance.current.loadSource(currentMovieData.streamUrl);

        playerInstance.current.on('play', () => setIsPlaying(true));
        playerInstance.current.on('pause', () => setIsPlaying(false));
        playerInstance.current.on('timeupdate', (time: number) => {
          setCurrentTime(time);
          // Marathon Mode - Auto skip intro using ref to avoid re-initializing player
          if (isMarathonModeRef.current && movie?.skipIntro && time < movie.skipIntro) {
            playerInstance.current.seek(movie.skipIntro);
          }
        });
        playerInstance.current.on('loadedmetadata', () => setDuration(videoRef.current?.duration || 0));

        playerInstance.current.on('manifestparsed', (data: any) => {
          if (data?.levels) {
            setQualities(data.levels.map((l: any, i: number) => ({
              id: i,
              label: `${l.height}p`,
              bitrate: l.bitrate
            })));
          }
        });

        playerInstance.current.on('audiotracksupdate', (tracks: any[]) => {
          setAudioTracks(tracks);
          if (playerInstance.current?.hls) {
            setCurrentAudio(playerInstance.current.hls.audioTrack);
          }
        });

        playerInstance.current.on('audiotrackchange', (index: number) => {
          setCurrentAudio(index);
        });

        playerInstance.current.on('subtitletracksupdate', (tracks: any[]) => {
          setSubtitleTracks(tracks);
          if (playerInstance.current?.hls) {
            setCurrentSub(playerInstance.current.hls.subtitleTrack);
          }
        });

        playerInstance.current.on('subtitletrackchange', (index: number) => {
          setCurrentSub(index);
        });
      }
    };

    initPlayer();

    return () => {
      isMounted = false;
      if (playerInstance.current) {
        playerInstance.current.destroy();
        playerInstance.current = null;
      }
    };
  }, [currentMovieData.streamUrl]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key.toLowerCase()) {
        case " ":
        case "k": e.preventDefault(); togglePlay(); break;
        case "f": e.preventDefault(); toggleFullscreen(); break;
        case "m": e.preventDefault(); toggleMute(); break;
        case "arrowleft": e.preventDefault(); skip(-10); break;
        case "arrowright": e.preventDefault(); skip(10); break;
        case "arrowup": e.preventDefault(); changeVolume(Math.min(1, volume + 0.1)); break;
        case "arrowdown": e.preventDefault(); changeVolume(Math.max(0, volume - 0.1)); break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [volume, isPlaying]);

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
      }
    };
    containerRef.current?.addEventListener("mousemove", handleMouseMove);
    return () => containerRef.current?.removeEventListener("mousemove", handleMouseMove);
  }, [isPlaying]);

  const togglePlay = () => isPlaying ? playerInstance.current?.pause() : playerInstance.current?.play();
  const toggleMute = () => { if (videoRef.current) { videoRef.current.muted = !isMuted; setIsMuted(!isMuted); } };
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { containerRef.current?.requestFullscreen(); setIsFullscreen(true); }
    else { document.exitFullscreen(); setIsFullscreen(false); }
  };
  const skip = (seconds: number) => {
    if (playerInstance.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      playerInstance.current.seek(newTime);
    }
  };

  const changeVolume = (newVolume: number) => {
    setVolume(newVolume);
    playerInstance.current?.setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const setQualityLevel = (id: number) => {
    setQuality(id === -1 ? "auto" : qualities[id].label);
    if (id === -1) playerInstance.current?.setAutoQuality();
    else playerInstance.current?.setQuality(id);
  };

  const setSpeed = (s: number) => {
    setPlaybackSpeed(s);
    playerInstance.current?.setPlaybackRate(s);
  };

  const handleReport = () => {
    alert("Сообщение о проблеме отправлено. Спасибо!");
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-black overflow-hidden select-none"
      style={{ cursor: showControls ? "default" : "none" }}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        poster={getProxiedUrl(streamData?.logo)}
        onClick={togglePlay}
      />

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="text-center p-8 bg-card rounded-2xl border border-border">
            <p className="text-white text-xl mb-4 font-semibold">{error}</p>
            <Button onClick={() => window.location.reload()} variant="default" className="bg-primary hover:bg-primary/90">
              Повторить попытку
            </Button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className={cn(
        "absolute top-0 left-0 right-0 p-8 bg-gradient-to-b from-black/95 via-black/40 to-transparent transition-all duration-500 z-30",
        showControls ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      )}>
        <div className="flex items-center justify-between w-full">
          <Link to={streamData?.isTV ? "/tv" : (id ? `/movie/${id}` : "/")} className="flex items-center gap-4 text-white group">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all shadow-lg backdrop-blur-md border border-white/5">
              <ChevronLeft className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight drop-shadow-lg">{currentMovieData.title}</h1>
              {!streamData?.isTV && movie?.type === 'series' && (
                <p className="text-sm text-white/50 font-medium uppercase tracking-widest mt-0.5">
                  Серия {currentMovieData.episode} • сезон {currentMovieData.season}
                </p>
              )}
            </div>
          </Link>
        </div>
      </div>

      {/* Large center controls */}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center gap-12 md:gap-24 transition-all duration-500 z-20",
        showControls ? "opacity-100 scale-100" : "opacity-0 scale-110 pointer-events-none"
      )}>
        <button onClick={() => skip(-10)} className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/15 transition-all group active:scale-90">
          <div className="relative group-hover:scale-110 transition-transform">
            <RotateCcw className="w-10 h-10 md:w-12 md:h-12 text-white" />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] md:text-[11px] font-black pb-0.5">10</span>
          </div>
        </button>
        <button onClick={togglePlay} className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 hover:scale-110 active:scale-95 transition-all shadow-[0_0_50px_rgba(0,0,0,0.5)] group">
          {isPlaying ? (
            <Pause className="w-12 h-12 md:w-16 md:h-16 text-white group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" fill="white" />
          ) : (
            <Play className="w-12 h-12 md:w-16 md:h-16 text-white ml-2 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" fill="white" />
          )}
        </button>
        <button onClick={() => skip(10)} className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/15 transition-all group active:scale-90">
          <div className="relative group-hover:scale-110 transition-transform">
            <RotateCw className="w-10 h-10 md:w-12 md:h-12 text-white" />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] md:text-[11px] font-black pb-0.5">10</span>
          </div>
        </button>
      </div>

      {/* Bottom controls container */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent transition-all duration-500 z-30 pt-20",
        showControls ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0 pointer-events-none"
      )}>
        <div className="w-full px-8 pb-8">
          {/* Skip Intro overlays */}
          <div className="flex justify-end gap-4 mb-8">
            {movie?.skipIntro && (
              <>
                {currentTime < movie.skipIntro && (
                  <Button
                    onClick={() => playerInstance.current?.seek(movie.skipIntro)}
                    className="bg-zinc-800/90 hover:bg-zinc-700 backdrop-blur-md border border-white/10 rounded-2xl h-14 px-8 font-bold shadow-2xl transition-all active:scale-95"
                  >
                    <RotateCw className="w-5 h-5 mr-3" />
                    Пропустить заставку
                  </Button>
                )}
                <Button
                  onClick={() => setIsMarathonMode(!isMarathonMode)}
                  className={cn(
                    "backdrop-blur-md border rounded-2xl h-14 px-8 font-bold transition-all shadow-2xl active:scale-95",
                    isMarathonMode ? "bg-primary border-primary/50 text-white" : "bg-red-600 border-red-500/50 text-white hover:bg-red-500"
                  )}
                >
                  <RotateCw className="w-5 h-5 mr-3" />
                  Пропустить все заставки и титры
                </Button>
              </>
            )}
          </div>

          {/* Progress Section */}
          <div className="relative mb-8 group/progress px-2">
            <div
              className="h-2 w-full bg-white/20 rounded-full overflow-hidden cursor-pointer transition-all duration-300 group-hover/progress:h-3"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                playerInstance.current?.seek(pos * duration);
              }}
            >
              <div
                className="h-full bg-primary relative transition-[width] duration-300 ease-linear shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                style={{ width: `${progress}%` }}
              >
                {/* Knob */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-primary rounded-full border-[3px] border-white shadow-[0_0_20px_rgba(0,0,0,0.8)] opacity-0 group-hover/progress:opacity-100 transition-all duration-300 scale-0 group-hover/progress:scale-100 translate-x-1/2" />
              </div>
            </div>
            <div className="flex justify-between mt-3 text-sm font-bold text-white/50 tracking-wider">
              <span className="group-hover/progress:text-white transition-colors">{formatTime(currentTime)}</span>
              <span className="group-hover/progress:text-white transition-colors">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-white/10 w-14 h-14 rounded-2xl transition-all active:scale-90">
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => skip(10)} className="text-white hover:bg-white/10 w-14 h-14 rounded-2xl transition-all active:scale-90">
                <RotateCw className="w-8 h-8" />
              </Button>
              <div className="flex items-center gap-3 group/volume ml-2">
                <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/10 w-12 h-12 rounded-2xl">
                  {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </Button>
                <div className="w-0 group-hover/volume:w-32 overflow-hidden transition-all duration-500 ease-in-out">
                  <Slider
                    value={[isMuted ? 0 : volume * 100]}
                    onValueChange={([v]) => changeVolume(v / 100)}
                    max={100}
                    className="w-32 ml-3"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {movie?.type === 'series' && (
                <Button
                  variant="ghost"
                  onClick={() => setIsEpisodesOpen(true)}
                  className="text-white hover:bg-white/10 h-14 rounded-2xl px-6 font-bold tracking-wide transition-all active:scale-95"
                >
                  <List className="w-6 h-6 mr-3" />
                  <span className="hidden lg:inline">Серии и сезоны</span>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 w-14 h-14 rounded-2xl transition-all active:scale-90">
                    <Languages className="w-7 h-7" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" container={containerRef.current} className="w-64 bg-zinc-900/98 border-white/10 backdrop-blur-2xl text-white rounded-3xl p-3 shadow-2xl">
                  <DropdownMenuLabel className="text-white/40 text-[11px] font-black uppercase tracking-[2px] pb-4 px-4 pt-2">Выбор языка</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5 mx-2 mb-2" />
                  <div className="max-h-[60vh] overflow-y-auto custom-scrollbar px-1">
                    {audioTracks.length > 0 ? (
                      audioTracks.map((track, idx) => (
                        <DropdownMenuItem
                          key={`audio-${idx}`}
                          onClick={() => {
                            playerInstance.current.setAudioTrack(idx);
                            setCurrentAudio(idx);
                          }}
                          className={cn(
                            "flex justify-between px-4 py-3.5 rounded-2xl transition-all mb-1 cursor-pointer",
                            currentAudio === idx ? "bg-primary/20 text-primary font-bold" : "hover:bg-white/5"
                          )}
                        >
                          <span className="text-sm">{track.name || track.lang || `Дорожка ${idx + 1}`}</span>
                          {currentAudio === idx && <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]" />}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-white/40">Дорожки недоступны</div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 w-14 h-14 rounded-2xl transition-all active:scale-90">
                    <Subtitles className="w-7 h-7" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" container={containerRef.current} className="w-64 bg-zinc-900/98 border-white/10 backdrop-blur-2xl text-white rounded-3xl p-3 shadow-2xl">
                  <DropdownMenuLabel className="text-white/40 text-[11px] font-black uppercase tracking-[2px] pb-4 px-4 pt-2">Субтитры</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5 mx-2 mb-2" />
                  <div className="max-h-[60vh] overflow-y-auto custom-scrollbar px-1">
                    <DropdownMenuItem
                      onClick={() => {
                        playerInstance.current.setSubtitleTrack(-1);
                        setCurrentSub(-1);
                      }}
                      className={cn(
                        "flex justify-between px-4 py-3.5 rounded-2xl transition-all mb-1 cursor-pointer",
                        currentSub === -1 ? "bg-primary/20 text-primary font-bold" : "hover:bg-white/5"
                      )}
                    >
                      <span className="text-sm">Выключены</span>
                      {currentSub === -1 && <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]" />}
                    </DropdownMenuItem>
                    {subtitleTracks.map((track, idx) => (
                      <DropdownMenuItem
                        key={`sub-${idx}`}
                        onClick={() => {
                          playerInstance.current.setSubtitleTrack(idx);
                          setCurrentSub(idx);
                        }}
                        className={cn(
                          "flex justify-between px-4 py-3.5 rounded-2xl transition-all mb-1 cursor-pointer",
                          currentSub === idx ? "bg-primary/20 text-primary font-bold" : "hover:bg-white/5"
                        )}
                      >
                        <span className="text-sm">{track.name || track.lang || `Субтитры ${idx + 1}`}</span>
                        {currentSub === idx && <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]" />}
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 w-14 h-14 rounded-2xl transition-all active:scale-90 group">
                    <Settings className="w-7 h-7 group-hover:rotate-90 transition-transform duration-700 ease-out" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" container={containerRef.current} className="w-80 bg-zinc-900/98 border-white/10 backdrop-blur-2xl text-white rounded-[32px] p-3 shadow-2xl">
                  <DropdownMenuLabel className="text-white/40 text-[11px] font-black uppercase tracking-[2px] pb-4 px-4 pt-2">Настройки</DropdownMenuLabel>

                  <div className="space-y-1 px-1">
                    <DropdownMenuSeparator className="bg-white/5 mb-2" />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="flex justify-between px-4 py-4 rounded-2xl hover:bg-white/5 cursor-pointer transition-all">
                        <div className="flex items-center gap-4">
                          <Maximize className="w-5 h-5 text-white/40" />
                          <span className="font-semibold">Качество</span>
                        </div>
                        <span className="text-primary font-black text-xs bg-primary/10 px-3 py-1 rounded-lg">{quality}</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal container={containerRef.current}>
                        <DropdownMenuSubContent className="bg-zinc-900/98 border-white/10 backdrop-blur-2xl text-white min-w-[180px] rounded-3xl p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                          <DropdownMenuItem onClick={() => setQualityLevel(-1)} className={cn("px-4 py-3 rounded-xl transition-all mb-1", quality === 'auto' ? "bg-primary/20 text-primary font-bold" : "focus:bg-white/10")}>Автоматически</DropdownMenuItem>
                          {qualities.map(q => (
                            <DropdownMenuItem key={q.id} onClick={() => setQualityLevel(q.id)} className={cn("px-4 py-3 rounded-xl transition-all mb-1", quality === q.label ? "bg-primary/20 text-primary font-bold" : "focus:bg-white/10")}>{q.label}</DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="flex justify-between px-4 py-4 rounded-2xl hover:bg-white/5 cursor-pointer transition-all">
                        <div className="flex items-center gap-4">
                          <Play className="w-5 h-5 text-white/40" />
                          <span className="font-semibold">Скорость</span>
                        </div>
                        <span className="text-primary font-black text-xs bg-primary/10 px-3 py-1 rounded-lg">{playbackSpeed === 1 ? '1.0x' : `${playbackSpeed}x`}</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal container={containerRef.current}>
                        <DropdownMenuSubContent className="bg-zinc-900/98 border-white/10 backdrop-blur-2xl text-white min-w-[150px] rounded-3xl p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                            <DropdownMenuItem key={s} onClick={() => setSpeed(s)} className={cn("px-4 py-3 rounded-xl transition-all mb-1", playbackSpeed === s ? "bg-primary/20 text-primary font-bold" : "focus:bg-white/10")}>{s === 1 ? 'Обычная' : `${s}x`}</DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <div className="px-4 py-4 rounded-2xl hover:bg-white/5 transition-all flex items-center justify-between cursor-pointer group/toggle" onClick={() => setIsMarathonMode(!isMarathonMode)}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-4">
                          <div className="w-5 h-5 flex items-center justify-center">
                            <div className={cn("w-3.5 h-3.5 rounded-full border-2 transition-all", isMarathonMode ? "bg-primary border-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" : "border-white/20")} />
                          </div>
                          <span className="font-semibold">Марафон</span>
                        </div>
                        <p className="text-[10px] text-white/40 font-bold ml-9 uppercase tracking-wider">Авто-пропуск интро</p>
                      </div>
                      <div className={cn("w-12 h-6 rounded-full relative transition-all duration-300", isMarathonMode ? "bg-primary" : "bg-white/10")}>
                        <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-lg", isMarathonMode ? "left-7" : "left-1")} />
                      </div>
                    </div>

                    <DropdownMenuSeparator className="bg-white/5 my-2" />

                    <DropdownMenuItem onClick={handleReport} className="flex items-center gap-4 px-4 py-4 rounded-2xl focus:bg-red-500/20 text-white/50 focus:text-white transition-all group/report">
                      <Flag className="w-5 h-5 group-hover/report:text-red-500 transition-colors" />
                      <span className="font-semibold">Сообщить о проблеме</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white hover:bg-white/10 w-14 h-14 rounded-2xl transition-all active:scale-90">
                {isFullscreen ? <Minimize className="w-7 h-7" /> : <Maximize className="w-7 h-7" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Episodes Sheet Overlay */}
      <div className={cn(
        "absolute right-0 top-0 bottom-0 w-full sm:w-[500px] bg-zinc-950/98 backdrop-blur-3xl border-l border-white/5 z-50 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-[-20px_0_50px_rgba(0,0,0,0.5)]",
        isEpisodesOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-10 h-full flex flex-col">
          <div className="flex items-center justify-between mb-12">
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tighter uppercase">{currentMovieData.title}</h2>
              <p className="text-xs text-white/30 font-bold uppercase tracking-[2px]">Список серий</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsEpisodesOpen(false)} className="rounded-full w-14 h-14 hover:bg-white/10 border border-white/5 active:scale-90 transition-all">
              <ChevronRight className="w-8 h-8" />
            </Button>
          </div>

          <div className="space-y-10 overflow-y-auto flex-1 pr-6 custom-scrollbar scroll-smooth">
            {[1].map(s => (
              <div key={s} className="space-y-8">
                <div className="flex items-center gap-4 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                  <h3 className="text-sm font-black text-white/80 uppercase tracking-[3px]">Сезон {s}</h3>
                </div>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(e => (
                    <button
                      key={e}
                      onClick={() => {
                        navigate(`/player/${id}?season=${s}&episode=${e}`);
                        setIsEpisodesOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-6 p-5 rounded-3xl text-left transition-all border border-transparent shadow-sm group",
                        parseInt(episode) === e ? "bg-primary/20 border-primary/30 ring-1 ring-primary/20 scale-[1.02]" : "hover:bg-white/5 hover:translate-x-2"
                      )}
                    >
                      <div className="w-32 h-20 rounded-2xl bg-zinc-900 border border-white/5 overflow-hidden flex-shrink-0 relative">
                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                          <Play className="w-8 h-8 fill-white drop-shadow-lg" />
                        </div>
                        {streamData?.logo && <img src={getProxiedUrl(streamData.logo)} className="w-full h-full object-cover grayscale-[0.2] transition-transform duration-500 group-hover:scale-110" />}
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold">45:00</div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="font-bold text-base group-hover:text-primary transition-colors">Серия {e}</div>
                        <div className="text-[11px] text-white/30 font-bold uppercase tracking-widest truncate">Эпизод {e} • 2025</div>
                      </div>
                      {parseInt(episode) === e && (
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
                          <span className="text-[8px] font-black text-primary uppercase">Live</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerPage;
