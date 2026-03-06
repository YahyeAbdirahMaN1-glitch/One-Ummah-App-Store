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
  
  const [videoType, setVideoType] = useState<VideoType>('littles');
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingOver, setIsStartingOver] = useState(false);

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
        // Don't trigger callback if we're just starting over
        if (!isStartingOver) {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          onVideoRecorded(blob, videoType);
        }
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
      stopCamera();
      onClose();
    }
  };

  const startOver = async () => {
    console.log('Start Over clicked');
    
    // Set flag to prevent onstop from calling onVideoRecorded
    setIsStartingOver(true);
    
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
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Clear the flag and start new recording
    setIsStartingOver(false);
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
    <div className="fixed inset-0 bg-black z-[9999] overflow-hidden">
      {/* Video Preview - z-index 0 (lowest, behind buttons) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover z-0 ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
        style={{ 
          objectPosition: 'center center',
          width: '100vw',
          height: '100vh',
          backgroundColor: '#000',
        }}
      />

      {/* Header - Close and Flip buttons only */}
      <div className="absolute top-0 left-0 right-0 z-10">
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
        <div className="absolute top-20 left-0 right-0 z-20 bg-black/95 py-6 px-4 border-b-2 border-amber-500/30">
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

      {/* Recording Indicator */}
      {isRecording && (
        <div className="absolute top-24 left-0 right-0 flex justify-center z-20">
          <div className="flex items-center gap-2 bg-red-600/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
            <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
            <span className="text-white font-black text-2xl tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
              REC
            </span>
          </div>
        </div>
      )}

      {/* Timer & Max Duration */}
      <div className="absolute top-40 left-0 right-0 flex justify-center z-10">
        <div className="bg-black/50 backdrop-blur-sm px-6 py-3 rounded-full">
          <p className="text-white text-2xl font-bold font-mono">
            {formatDuration(duration)} / {getMaxDuration()}
          </p>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8 z-10">
        {/* Start Over Button */}
        {isRecording && (
          <button
            onClick={startOver}
            className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-white/30 hover:bg-white/30 transition-all"
          >
            <span className="text-white font-semibold">Start Over</span>
          </button>
        )}

        {/* Record/Stop Button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            isRecording
              ? 'bg-red-600 scale-110'
              : 'bg-white/20 border-4 border-white'
          }`}
        >
          {isRecording ? (
            <div className="w-8 h-8 bg-white rounded-sm"></div>
          ) : (
            <div className="w-16 h-16 bg-red-600 rounded-full"></div>
          )}
        </button>
      </div>
    </div>
  );
}
