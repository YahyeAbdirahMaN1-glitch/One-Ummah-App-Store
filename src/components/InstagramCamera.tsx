import { useEffect, useRef, useState } from 'react';
import { X, RotateCw, Video } from 'lucide-react';

interface InstagramCameraProps {
  onClose: () => void;
  onVideoRecorded: (blob: Blob, type: 'littles' | 'length') => void;
}

type VideoType = 'littles' | 'length';

export default function InstagramCamera({ onClose, onVideoRecorded }: InstagramCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isStartingOverRef = useRef(false);
  
  const [videoType, setVideoType] = useState<VideoType>('littles');
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Start camera
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [cameraFacing]);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);
      stopCamera();
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera not supported in this browser. Please use Chrome, Safari, or Firefox.');
        setIsLoading(false);
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });
      
      streamRef.current = stream;
      
      console.log('Stream created:', stream);
      console.log('Video ref exists:', !!videoRef.current);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('Stream assigned to video element');
        
        // Force video to be visible
        videoRef.current.style.display = 'block';
        videoRef.current.style.opacity = '1';
        
        // Wait for video to be ready and playing
        videoRef.current.onloadedmetadata = async () => {
          console.log('Video metadata loaded');
          try {
            if (videoRef.current) {
              await videoRef.current.play();
              console.log('Camera started successfully - video is playing');
              // Only hide loading AFTER video is actually playing
              setIsLoading(false);
              setError(null);
            }
          } catch (playErr) {
            console.error('Video play error:', playErr);
            setIsLoading(false);
            setError('Failed to start camera. Please try again.');
          }
        };
        
        // Fallback: hide loading after 2 seconds even if onloadedmetadata doesn't fire
        setTimeout(() => {
          if (videoRef.current && videoRef.current.srcObject) {
            console.log('Fallback: hiding loading screen');
            setIsLoading(false);
          }
        }, 2000);
      } else {
        console.error('Video ref is null!');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setIsLoading(false);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please:\n1. Click the camera icon in your browser address bar\n2. Allow camera and microphone access\n3. Click the button below to try again');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found. Please ensure your device has a working camera.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is in use by another application. Please close other apps using the camera.');
      } else if (err.name === 'OverconstrainedError') {
        setError('Camera settings not supported. Trying simpler settings...');
        setIsLoading(true);
        // Try again with simpler constraints
        try {
          const simpleStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          streamRef.current = simpleStream;
          if (videoRef.current) {
            videoRef.current.srcObject = simpleStream;
            await videoRef.current.play();
          }
          setError(null);
          setIsLoading(false);
        } catch {
          setError('Failed to access camera with any settings.');
          setIsLoading(false);
        }
      } else {
        setError(`Camera error: ${err.message || 'Unknown error'}. Please refresh and try again.`);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const flipCamera = () => {
    setCameraFacing(prev => prev === 'user' ? 'environment' : 'user');
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    try {
      setDuration(0);
      chunksRef.current = [];
      
      const recorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm',
        videoBitsPerSecond: 2500000,
      });
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        // onstop handler now just handles the start-over flag
        // Blob creation moved to stopRecording() function
        isStartingOverRef.current = false;
      };
      
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      
      // Timer
      const interval = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          // Littles max: 180 seconds (3 minutes)
          if (videoType === 'littles' && newDuration >= 180) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);
      
      (recorder as any).durationInterval = interval;
    } catch (err) {
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      const interval = (mediaRecorderRef.current as any).durationInterval;
      if (interval) clearInterval(interval);
      
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Create blob and show preview (don't close camera yet)
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
    }
  };
  
  const postVideo = () => {
    if (recordedBlob) {
      onVideoRecorded(recordedBlob, videoType);
      stopCamera();
      onClose();
    }
  };
  
  const discardVideo = () => {
    setRecordedBlob(null);
    setDuration(0);
    chunksRef.current = [];
    // Camera is still running, user can record again
  };

  const startOver = async () => {
    console.log('Start Over clicked');
    
    // Set flag to prevent onstop from calling onVideoRecorded
    isStartingOverRef.current = true;
    
    // Stop current recording
    if (isRecording && mediaRecorderRef.current) {
      const interval = (mediaRecorderRef.current as any).durationInterval;
      if (interval) clearInterval(interval);
      
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      
      console.log('Stopped current recording');
    }
    
    // Reset state
    setIsRecording(false);
    setDuration(0);
    chunksRef.current = [];
    
    // Wait a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Start new recording (flag will be cleared in onstop handler)
    console.log('Starting new recording');
    startRecording();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMaxDuration = () => {
    return videoType === 'littles' ? '3:00' : '∞';
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <Video className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Camera Access Needed</h2>
            <p className="text-gray-300 whitespace-pre-line">{error}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={startCamera}
              className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-amber-500 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Starting Camera...</h2>
          <p className="text-gray-400">Please allow camera and microphone access when prompted</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-[9999] overflow-hidden" style={{ width: '100vw', height: '100vh' }}>
      {/* Video Preview - Must be visible */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
        style={{ 
          objectPosition: 'center center',
          width: '100vw',
          height: '100vh',
          backgroundColor: '#000',
          zIndex: 1,
          display: 'block',
          opacity: 1,
        }}
      />

      {/* Header - Close and Flip buttons only */}
      <div className="absolute top-0 left-0 right-0" style={{ zIndex: 50 }}>
        <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/90 to-transparent">
          <button
            onClick={onClose}
            className="p-3 rounded-full bg-black/70 backdrop-blur-sm hover:bg-black/90 transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={flipCamera}
            disabled={isRecording}
            className="p-3 rounded-full bg-black/70 backdrop-blur-sm hover:bg-black/90 transition-all disabled:opacity-50"
          >
            <RotateCw className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Littles / Length Selector - SEPARATE SOLID SECTION */}
      {!isRecording && (
        <div className="absolute top-20 left-0 right-0 bg-black/95 py-6 px-4 border-b-2 border-amber-500/30" style={{ zIndex: 50 }}>
          <div className="flex justify-center gap-4">
            {/* LITTLES BUTTON */}
            <button
              onClick={() => setVideoType('littles')}
              className={`flex-1 max-w-[160px] py-5 px-4 rounded-2xl transition-all duration-200 ${
                videoType === 'littles'
                  ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.8)] scale-105 border-4 border-white'
                  : 'bg-black border-4 border-white text-white hover:bg-gray-900'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <span className={`font-black text-3xl tracking-wider ${
                  videoType === 'littles' ? 'text-black' : 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]'
                }`}>
                  LITTLES
                </span>
                <span className={`text-sm font-bold tracking-wide ${
                  videoType === 'littles' ? 'text-black' : 'text-white'
                }`}>
                  3 MIN MAX
                </span>
              </div>
            </button>

            {/* LENGTH BUTTON */}
            <button
              onClick={() => setVideoType('length')}
              className={`flex-1 max-w-[160px] py-5 px-4 rounded-2xl transition-all duration-200 ${
                videoType === 'length'
                  ? 'bg-green-400 text-black shadow-[0_0_30px_rgba(74,222,128,0.8)] scale-105 border-4 border-green-400'
                  : 'bg-black border-4 border-green-400 text-green-400 hover:bg-gray-900'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <span className={`font-black text-3xl tracking-wider ${
                  videoType === 'length' ? 'text-black' : 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]'
                }`}>
                  LENGTH
                </span>
                <span className={`text-sm font-bold tracking-wide ${
                  videoType === 'length' ? 'text-black' : 'text-green-400'
                }`}>
                  UNLIMITED
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Recording Indicator - Instagram Style */}
      {isRecording && (
        <div className="absolute top-24 left-0 right-0 flex justify-center z-20">
          <div className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 backdrop-blur-lg px-5 py-2 rounded-full shadow-xl shadow-red-900/40 border border-red-400/30">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="text-white font-bold text-base tracking-wide drop-shadow-lg">
              REC
            </span>
          </div>
        </div>
      )}

      {/* Timer - Instagram Style with Gold Accent */}
      <div className="absolute top-40 left-0 right-0 flex justify-center z-10">
        <div className="bg-gradient-to-r from-black/70 to-black/60 backdrop-blur-lg px-6 py-2 rounded-full shadow-xl border border-amber-400/30">
          <p className="text-amber-100 text-xl font-semibold font-mono tracking-wide drop-shadow-lg">
            {formatDuration(duration)} / {getMaxDuration()}
          </p>
        </div>
      </div>

      {/* Recording Controls - Instagram Style with One Ummah Branding */}
      {isRecording && !recordedBlob && (
        <>
          {/* Start Over - Left Side (Instagram style) */}
          <button
            onClick={startOver}
            className="absolute bottom-32 left-6 flex items-center gap-2 bg-gradient-to-r from-black/60 to-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/50 hover:border-amber-400/70 hover:bg-black/70 transition-all shadow-xl"
            style={{ zIndex: 50 }}
          >
            <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-xs">↻</span>
            </div>
            <span className="text-white font-semibold text-sm tracking-tight drop-shadow-lg">
              Start Over
            </span>
          </button>

          {/* STOP - Right Side (Instagram style with gold accent) */}
          <button
            onClick={stopRecording}
            className="absolute bottom-32 right-6 flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-5 py-2 rounded-full shadow-2xl shadow-amber-500/40 hover:shadow-amber-500/60 border border-amber-300/30 transition-all"
            style={{ zIndex: 50 }}
          >
            <div className="w-2 h-2 bg-white rounded-sm animate-pulse"></div>
            <span className="text-white font-bold text-sm tracking-wide drop-shadow-lg">
              STOP
            </span>
          </button>
        </>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-8 left-0 right-0 px-4" style={{ zIndex: 50 }}>

        {/* Preview State - Instagram Style with One Ummah Gold */}
        {recordedBlob && (
          <div className="flex justify-center items-center gap-4">
            {/* Discard - Instagram style */}
            <button
              onClick={discardVideo}
              className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/50 hover:border-white hover:bg-black/70 transition-all shadow-xl"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-white font-semibold text-base tracking-tight drop-shadow-lg">
                Discard
              </span>
            </button>

            {/* Post - One Ummah Gold Gradient (Instagram inspired) */}
            <button
              onClick={postVideo}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:via-amber-700 hover:to-yellow-600 px-8 py-3 rounded-full shadow-2xl shadow-amber-500/50 hover:shadow-amber-500/70 border border-amber-300/40 transition-all scale-105 hover:scale-110"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-white font-bold text-lg tracking-wide drop-shadow-lg">
                Post
              </span>
            </button>
          </div>
        )}

        {/* Initial State - Instagram Record Button with Gold Accent */}
        {!isRecording && !recordedBlob && (
          <div className="flex justify-center">
            <button
              onClick={startRecording}
              className="relative w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5 border-4 border-amber-400 hover:border-amber-300 transition-all hover:scale-105 shadow-2xl shadow-amber-500/30"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-full shadow-lg"></div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
