import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Terminal,
  ExternalLink,
  Play,
  Pause,
  Volume2,
  VolumeX,
  User,
  AlertTriangle,
  RefreshCw,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import styles from './VideosScreen.module.css';

// Sample video data with reliable sources
const VIDEOS = [
  {
    id: '1',
    username: 'reactninja',
    description: 'Building a modern React component with TypeScript and hooks #react #typescript #webdev',
    likes: 1245,
    comments: 87,
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    tags: ['react', 'typescript', 'frontend'],
    demoUrl: 'https://example.com/demo1'
  },
  {
    id: '2',
    username: 'cssmagician',
    description: 'CSS-only animation tricks that will blow your mind! #css #webdesign #frontend',
    likes: 3422,
    comments: 156,
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://images.pexels.com/photos/270348/pexels-photo-270348.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    tags: ['css', 'animation', 'webdesign'],
    demoUrl: 'https://example.com/demo2'
  },
  {
    id: '3',
    username: 'nodehero',
    description: 'Optimizing your Node.js API for maximum performance #nodejs #backend #api',
    likes: 872,
    comments: 43,
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    tags: ['nodejs', 'api', 'performance'],
    demoUrl: 'https://example.com/demo3'
  },
  {
    id: '4',
    username: 'jsmaster',
    description: 'JavaScript tips and tricks that will make you a better developer #javascript #webdev #tips',
    likes: 2156,
    comments: 102,
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail: 'https://images.pexels.com/photos/2004161/pexels-photo-2004161.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    tags: ['javascript', 'tips', 'webdev'],
    demoUrl: 'https://example.com/demo4'
  },
  {
    id: '5',
    username: 'pythonista',
    description: 'Data analysis with Python in under 60 seconds #python #datascience #coding',
    likes: 1732,
    comments: 65,
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnail: 'https://images.pexels.com/photos/1181298/pexels-photo-1181298.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    tags: ['python', 'datascience', 'tutorial'],
    demoUrl: 'https://example.com/demo5'
  }
];

const VideosScreen = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({});
  const [isLiked, setIsLiked] = useState<Record<string, boolean>>({});
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [hasError, setHasError] = useState<Record<string, boolean>>({});
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);
  const videoContainersRef = useRef<Record<string, HTMLDivElement | null>>({});
  const reelsContainerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true); // Track if component is mounted

  // Track window size for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set isMountedRef to false when component unmounts
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Safely play video with checks
  const safePlayVideo = (video: HTMLVideoElement | null, videoId: string) => {
    if (!video || !isMountedRef.current) return Promise.reject(new Error('Video element not available'));
    
    // Ensure video is muted before attempting autoplay
    video.muted = true;
    
    return video.play()
      .then(() => {
        if (isMountedRef.current) {
          setIsPlaying(prev => ({ ...prev, [videoId]: true }));
          // After successful play, apply the user's mute preference
          video.muted = isMuted;
        }
        return true;
      })
      .catch(error => {
        console.error("Error playing video:", error);
        if (isMountedRef.current) {
          setHasError(prev => ({ ...prev, [videoId]: true }));
        }
        return false;
      });
  };

  // Set up intersection observer for videos
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (!isMountedRef.current) return; // Check if component is still mounted
        
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const videoId = entry.target.getAttribute('data-video-id');
            if (videoId) {
              // Pause all other videos
              Object.keys(isPlaying).forEach((id) => {
                if (id !== videoId && isPlaying[id]) {
                  const videoElement = videoRefs.current[id];
                  if (videoElement) {
                    videoElement.pause();
                    if (isMountedRef.current) {
                      setIsPlaying((prev) => ({ ...prev, [id]: false }));
                    }
                  }
                }
              });
              
              // Auto-play the current video if it's not already playing and doesn't have an error
              const currentVideo = videoRefs.current[videoId];
              if (currentVideo && !isPlaying[videoId] && !hasError[videoId]) {
                safePlayVideo(currentVideo, videoId);
              }
              
              // Set current video index
              const index = VIDEOS.findIndex(v => v.id === videoId);
              if (index !== -1 && isMountedRef.current) {
                setCurrentVideoIndex(index);
              }
            }
          }
        });
      },
      { 
        threshold: 0.7, // 70% of the video must be visible
        root: null // Use viewport as root
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isPlaying, hasError, isMuted]);

  // Observer each video container
  useEffect(() => {
    if (observerRef.current) {
      Object.keys(videoContainersRef.current).forEach((id) => {
        const container = videoContainersRef.current[id];
        if (container) {
          observerRef.current?.observe(container);
        }
      });
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [videoContainersRef.current]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isMountedRef.current) return; // Check if component is still mounted
      
      if (e.key === 'ArrowUp') {
        if (currentVideoIndex > 0) {
          scrollToVideo(currentVideoIndex - 1);
        }
      } else if (e.key === 'ArrowDown') {
        if (currentVideoIndex < VIDEOS.length - 1) {
          scrollToVideo(currentVideoIndex + 1);
        }
      } else if (e.key === ' ' || e.key === 'k') {
        // Space or 'k' to toggle play/pause like YouTube
        const currentVideo = VIDEOS[currentVideoIndex];
        if (currentVideo) {
          togglePlay(currentVideo.id);
        }
        e.preventDefault(); // Prevent scrolling on spacebar
      } else if (e.key === 'm') {
        // 'm' to toggle mute
        toggleMute();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentVideoIndex, isPlaying, isMuted]);

  // Function to handle device orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      if (!isMountedRef.current) return; // Check if component is still mounted
      
      if (currentVideoIndex >= 0 && currentVideoIndex < VIDEOS.length) {
        // Give a moment for the orientation to complete then scroll
        setTimeout(() => {
          scrollToVideo(currentVideoIndex);
        }, 300);
      }
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    return () => window.removeEventListener('orientationchange', handleOrientationChange);
  }, [currentVideoIndex]);

  const scrollToVideo = (index: number) => {
    if (!isMountedRef.current) return; // Check if component is still mounted
    
    const videoId = VIDEOS[index].id;
    const container = videoContainersRef.current[videoId];
    if (container && reelsContainerRef.current) {
      container.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleVideoContainerRef = (ref: HTMLDivElement | null, id: string) => {
    if (ref && isMountedRef.current) {
      videoContainersRef.current[id] = ref;
      // Observe this container
      if (observerRef.current) {
        observerRef.current.observe(ref);
      }
    }
  };

  const handleVideoRef = (ref: HTMLVideoElement | null, id: string) => {
    if (ref && isMountedRef.current) {
      videoRefs.current[id] = ref;
      ref.muted = isMuted;
      
      // Add event listeners for more responsive playback control
      ref.addEventListener('play', () => {
        if (isMountedRef.current) {
          setIsPlaying(prev => ({ ...prev, [id]: true }));
        }
      });
      
      ref.addEventListener('pause', () => {
        if (isMountedRef.current) {
          setIsPlaying(prev => ({ ...prev, [id]: false }));
        }
      });
      
      ref.addEventListener('ended', () => {
        // Loop the video
        if (ref && isMountedRef.current) {
          ref.currentTime = 0;
          safePlayVideo(ref, id);
        }
      });
    }
  };

  const togglePlay = (id: string) => {
    if (!isMountedRef.current) return; // Check if component is still mounted
    
    if (hasError[id]) {
      // If there was an error, try reloading the video
      const video = videoRefs.current[id];
      if (video) {
        video.load();
        setHasError(prev => ({ ...prev, [id]: false }));
        setIsLoading(prev => ({ ...prev, [id]: true }));
        return;
      }
    }
    
    const video = videoRefs.current[id];
    if (video) {
      if (isPlaying[id]) {
        video.pause();
      } else {
        // Pause all other videos
        Object.keys(videoRefs.current).forEach((videoId) => {
          if (videoId !== id) {
            const otherVideo = videoRefs.current[videoId];
            if (otherVideo) {
              otherVideo.pause();
              if (isMountedRef.current) {
                setIsPlaying(prev => ({ ...prev, [videoId]: false }));
              }
            }
          }
        });
        
        safePlayVideo(video, id);
      }
    }
  };

  const toggleMute = () => {
    if (!isMountedRef.current) return; // Check if component is still mounted
    
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    // Update all videos
    Object.values(videoRefs.current).forEach(video => {
      if (video) {
        video.muted = newMutedState;
      }
    });
  };

  const handleLoadStart = (id: string) => {
    if (!isMountedRef.current) return; // Check if component is still mounted
    
    setIsLoading((prev) => ({ ...prev, [id]: true }));
    setHasError((prev) => ({ ...prev, [id]: false }));
  };

  const handleLoadedData = (id: string) => {
    if (!isMountedRef.current) return; // Check if component is still mounted
    
    setIsLoading((prev) => ({ ...prev, [id]: false }));
    
    // Try auto-playing the video if it's the current one
    const index = VIDEOS.findIndex(v => v.id === id);
    if (index === currentVideoIndex) {
      const video = videoRefs.current[id];
      if (video && !hasError[id]) {
        safePlayVideo(video, id);
      }
    }
  };

  const handleError = (id: string, e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    if (!isMountedRef.current) return; // Check if component is still mounted
    
    console.error(`Video error for ${id}:`, e);
    setIsLoading(prev => ({ ...prev, [id]: false }));
    setHasError(prev => ({ ...prev, [id]: true }));
    setIsPlaying(prev => ({ ...prev, [id]: false }));
  };

  const handleOpenTerminal = () => {
    navigate('/terminal');
  };

  const handleLike = (id: string) => {
    if (!isMountedRef.current) return; // Check if component is still mounted
    
    setIsLiked(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRetry = (id: string, e: React.MouseEvent) => {
    if (!isMountedRef.current) return; // Check if component is still mounted
    
    e.stopPropagation();
    const video = videoRefs.current[id];
    if (video) {
      // Reset video and try again
      setIsLoading(prev => ({ ...prev, [id]: true }));
      setHasError(prev => ({ ...prev, [id]: false }));
      
      // Force reload the video element
      video.load();
      
      // Attempt to play after a short delay
      setTimeout(() => {
        if (video && !hasError[id] && isMountedRef.current) {
          safePlayVideo(video, id);
        }
      }, 500);
    }
  };

  // Navigation controls
  const handlePreviousVideo = () => {
    if (!isMountedRef.current) return; // Check if component is still mounted
    
    if (currentVideoIndex > 0) {
      scrollToVideo(currentVideoIndex - 1);
    }
  };

  const handleNextVideo = () => {
    if (!isMountedRef.current) return; // Check if component is still mounted
    
    if (currentVideoIndex < VIDEOS.length - 1) {
      scrollToVideo(currentVideoIndex + 1);
    }
  };

  // Determine if we should show the full UI or a simplified version based on screen size
  const isSmallScreen = windowWidth <= 360;
  const isVerySmallScreen = windowWidth <= 320;
  const isLandscape = windowWidth > windowHeight;

  return (
    <div className={styles.container} style={{ backgroundColor: "black" }}>
      <div 
        className={styles.reelsContainer}
        ref={reelsContainerRef}
      >
        {VIDEOS.map((video, index) => (
          <div 
            key={video.id}
            className={styles.reelItem}
            ref={(ref) => handleVideoContainerRef(ref, video.id)}
            data-video-id={video.id}
          >
            <div className={styles.videoContainer}>
              {/* Video thumbnail until video loads */}
              <img 
                src={video.thumbnail}
                alt={`${video.username}'s video thumbnail`}
                className={styles.videoThumbnail}
                style={{ opacity: isPlaying[video.id] ? 0 : 1 }}
              />
              
              {/* Actual video element */}
              <video
                ref={(ref) => handleVideoRef(ref, video.id)}
                className={styles.video}
                poster={video.thumbnail}
                playsInline
                muted
                loop
                onLoadStart={() => handleLoadStart(video.id)}
                onLoadedData={() => handleLoadedData(video.id)}
                onError={(e) => handleError(video.id, e)}
                onClick={() => togglePlay(video.id)}
              >
                <source src={video.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* Loading indicator */}
              {isLoading[video.id] && (
                <div className={styles.loadingOverlay}>
                  <div className={styles.loader}></div>
                </div>
              )}
              
              {/* Error display */}
              {hasError[video.id] && (
                <div className={styles.errorOverlay}>
                  <AlertTriangle size={isVerySmallScreen ? 30 : 40} color="#FFFFFF" />
                  <p>Failed to load video</p>
                  <button 
                    className={styles.retryButton}
                    onClick={(e) => handleRetry(video.id, e)}
                  >
                    <RefreshCw size={16} color="#FFFFFF" style={{ marginRight: '8px' }} />
                    Try Again
                  </button>
                </div>
              )}
              
              {/* Play/Pause overlay */}
              <div 
                className={styles.playPauseOverlay}
                style={{ opacity: isPlaying[video.id] ? 0 : 0.7 }}
                onClick={() => togglePlay(video.id)}
              >
                {isPlaying[video.id] ? (
                  <Pause size={isVerySmallScreen ? 40 : 50} color="#FFFFFF" />
                ) : (
                  <Play size={isVerySmallScreen ? 40 : 50} color="#FFFFFF" />
                )}
              </div>
              
              {/* Video controls */}
              <div className={styles.videoControls}>
                <button 
                  className={styles.muteButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute();
                  }}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX size={isSmallScreen ? 20 : 24} color="#FFFFFF" />
                  ) : (
                    <Volume2 size={isSmallScreen ? 20 : 24} color="#FFFFFF" />
                  )}
                </button>
              </div>
              
              {/* Video information overlay */}
              <div className={styles.userInfo}>
                <div className={styles.userHeader}>
                  <div className={styles.userAvatar}>
                    <User size={isSmallScreen ? 16 : 20} color="#FFFFFF" />
                  </div>
                  <h3 className={styles.username}>@{video.username}</h3>
                </div>
                
                <p className={styles.description}>{video.description}</p>
                
                <div className={styles.tags}>
                  {/* Limit number of tags based on screen size */}
                  {video.tags.slice(0, isSmallScreen ? 2 : (isLandscape ? 4 : 3)).map((tag, idx) => (
                    <span 
                      key={idx} 
                      className={styles.tag}
                      style={{ backgroundColor: colors.primary }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                
                <div className={styles.actionButtons}>
                  <button 
                    className={styles.actionButton}
                    style={{ backgroundColor: colors.primary }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenTerminal();
                    }}
                  >
                    <Terminal size={isSmallScreen ? 16 : 20} color="#FFFFFF" />
                    <span>Open Terminal</span>
                  </button>
                  
                  <button 
                    className={styles.actionButton}
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(video.demoUrl, '_blank');
                    }}
                  >
                    <ExternalLink size={isSmallScreen ? 14 : 16} color="#FFFFFF" />
                    <span>View Demo</span>
                  </button>
                </div>
              </div>
              
              {/* Side interaction buttons */}
              <div className={styles.sideButtons}>
                <button 
                  className={styles.iconButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(video.id);
                  }}
                  aria-label={isLiked[video.id] ? "Unlike" : "Like"}
                >
                  <Heart 
                    size={isSmallScreen ? 24 : 28} 
                    fill={isLiked[video.id] ? "#ff2b55" : "none"} 
                    color={isLiked[video.id] ? "#ff2b55" : "#FFFFFF"} 
                  />
                  <span className={styles.iconCount}>
                    {isLiked[video.id] ? video.likes + 1 : video.likes}
                  </span>
                </button>
                
                <button 
                  className={styles.iconButton}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Comments"
                >
                  <MessageCircle size={isSmallScreen ? 24 : 28} color="#FFFFFF" />
                  <span className={styles.iconCount}>{video.comments}</span>
                </button>
                
                <button 
                  className={styles.iconButton}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Save"
                >
                  <Bookmark size={isSmallScreen ? 24 : 28} color="#FFFFFF" />
                </button>
                
                <button 
                  className={styles.iconButton}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Share"
                >
                  <Share2 size={isSmallScreen ? 24 : 28} color="#FFFFFF" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Video pagination indicators */}
      <div className={styles.indicators}>
        {VIDEOS.map((_, index) => (
          <div 
            key={index} 
            className={`${styles.indicator} ${index === currentVideoIndex ? styles.indicatorActive : ''}`}
            onClick={() => scrollToVideo(index)}
          />
        ))}
      </div>
      
      {/* Navigation buttons for going between videos */}
      <div className={styles.verticalNav}>
        <button 
          className={`${styles.navButton} ${currentVideoIndex <= 0 ? styles.navButtonDisabled : ''}`}
          onClick={handlePreviousVideo}
          disabled={currentVideoIndex <= 0}
          aria-label="Previous video"
        >
          <ChevronUp size={isSmallScreen ? 20 : 24} color="#FFFFFF" />
        </button>
        
        <button 
          className={`${styles.navButton} ${currentVideoIndex >= VIDEOS.length - 1 ? styles.navButtonDisabled : ''}`}
          onClick={handleNextVideo}
          disabled={currentVideoIndex >= VIDEOS.length - 1}
          aria-label="Next video"
        >
          <ChevronDown size={isSmallScreen ? 20 : 24} color="#FFFFFF" />
        </button>
      </div>
    </div>
  );
};

export default VideosScreen;