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

  // Start camera (don't restart if recording)
  useEffect(() => {
    if (!isRecording) {
      startCamera();
    }
    return () => {
      if (!isRecording) {
        stopCamera();
      }
    };
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
          // Littles max: 30 seconds (to keep file size under 10MB)
          if (videoType === 'littles' && newDuration >= 30) {
            stopRecording();
          }
          // Length max: 60 seconds (1 minute)
          if (videoType === 'length' && newDuration >= 60) {
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
    console.log('[Camera] Stop Recording clicked', {
      hasRecorder: !!mediaRecorderRef.current,
      isRecording,
      chunksCount: chunksRef.current.length
    });
    
    if (mediaRecorderRef.current && isRecording) {
      const interval = (mediaRecorderRef.current as any).durationInterval;
      if (interval) {
        clearInterval(interval);
        console.log('[Camera] Cleared duration interval');
      }
      
      mediaRecorderRef.current.stop();
      console.log('[Camera] MediaRecorder stopped');
      
      setIsRecording(false);
      console.log('[Camera] isRecording set to false');
      
      // Wait a moment for all data to arrive
      setTimeout(() => {
        console.log('[Camera] Creating blob from chunks:', chunksRef.current.length);
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        console.log('[Camera] Blob created:', blob.size, 'bytes');
        
        if (blob.size === 0) {
          console.error('[Camera] WARNING: Blob is empty! No video data recorded.');
          alert('Recording failed - no video data captured. Please try again.');
          return;
        }
        
        setRecordedBlob(blob);
        console.log('[Camera] recordedBlob state updated, showing preview');
      }, 100); // Small delay to ensure all chunks arrive
    }
  };
  
  const postVideo = () => {
    console.log('[Camera] Post Video clicked', {
      hasBlob: !!recordedBlob,
      blobSize: recordedBlob?.size,
      videoType
    });
    
    if (recordedBlob) {
      console.log('[Camera] Calling onVideoRecorded with blob:', recordedBlob.size, 'bytes');
      onVideoRecorded(recordedBlob, videoType);
      
      console.log('[Camera] Stopping camera...');
      stopCamera();
      
      console.log('[Camera] Closing camera...');
      onClose();
      
      console.log('[Camera] Post Video complete');
    } else {
      console.error('[Camera] No recorded blob available!');
      alert('No video recorded. Please try recording again.');
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
    return videoType === 'littles' ? '0:30' : '1:00';
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
        className="absolute inset-0 w-full h-full object-cover"
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
                  30 SEC MAX
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
                  1 MIN MAX
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Recording Indicator - One Ummah Premium Style - BIGGER AND MORE VISIBLE */}
      {isRecording && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 bg-gradient-to-r from-red-600 via-red-500 to-red-600 px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.8)] border-2 border-red-300/50 animate-pulse-slow">
            <div className="w-4 h-4 bg-white rounded-full animate-pulse shadow-[0_0_12px_rgba(255,255,255,1)]"></div>
            <span className="text-white font-black text-2xl tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {formatDuration(duration)} / {getMaxDuration()}
            </span>
          </div>
        </div>
      )}

      {/* Video Mode Badge - One Ummah Gold Accent */}
      {!isRecording && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-gradient-to-r from-black/50 via-amber-950/40 to-black/50 backdrop-blur-md px-5 py-2 rounded-full border border-amber-500/20 shadow-lg">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 font-bold text-sm tracking-wide">
              {videoType === 'littles' ? 'LITTLES MODE' : 'LENGTH MODE'}
            </span>
          </div>
        </div>
      )}

      {/* Bottom Controls - One Ummah Premium Islamic Design */}
      <div className="absolute bottom-0 left-0 right-0 pb-8 pt-6 bg-gradient-to-t from-black via-amber-950/20 to-transparent" style={{ zIndex: 50 }}>
        
        {/* Recording State - One Ummah Gold Accent */}
        {isRecording && !recordedBlob && (
          <div className="relative">
            {/* Stop Button (center) - Absolutely centered */}
            <div className="flex items-center justify-center">
              <button
                onClick={stopRecording}
                className="relative w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center hover:scale-105 transition-all shadow-[0_0_30px_rgba(251,191,36,0.5)]"
              >
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-sm shadow-lg"></div>
                </div>
              </button>
            </div>

            {/* Flip Camera (right side, absolute positioned) - Gold accent */}
            <button
              onClick={flipCamera}
              disabled={isRecording}
              className="absolute right-12 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 backdrop-blur-md border border-amber-500/30 flex items-center justify-center hover:bg-black/80 hover:border-amber-400/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <RotateCw className="w-6 h-6 text-amber-300" />
            </button>
          </div>
        )}

        {/* Preview State - One Ummah Premium Gold Design - ENHANCED VISIBILITY */}
        {recordedBlob && (
          <div className="space-y-4">
            {/* Video recorded message */}
            <div className="text-center">
              <p className="text-white text-xl font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                Video Recorded! ({(recordedBlob.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
              <p className="text-amber-300 text-sm font-semibold mt-1">
                Choose an option below
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-8 px-8">
              {/* Retake - Premium black with gold border */}
              <button
                onClick={discardVideo}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-16 h-16 rounded-full bg-black/70 backdrop-blur-md border-2 border-amber-500/40 flex items-center justify-center hover:bg-black/80 hover:border-amber-400/60 transition-all shadow-lg active:scale-95">
                  <svg className="w-8 h-8 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <span className="text-amber-200 text-base font-bold tracking-wide">Retake</span>
              </button>

              {/* Use Video - Islamic Gold Gradient - BIGGER AND MORE PROMINENT */}
              <button
                onClick={postVideo}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center hover:scale-110 transition-all shadow-[0_0_50px_rgba(251,191,36,0.8)] border-4 border-amber-300/50 active:scale-105 animate-pulse-slow">
                  <svg className="w-12 h-12 text-black drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-amber-200 text-lg font-black tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">USE VIDEO</span>
              </button>
            </div>
          </div>
        )}

        {/* Initial State - One Ummah Islamic Gold Record Button */}
        {!isRecording && !recordedBlob && (
          <div className="flex items-center justify-between px-12">
            {/* Library/Gallery button (left) - Gold accent preview */}
            <div className="w-12 h-12 rounded-xl border-2 border-amber-500/30 overflow-hidden bg-gradient-to-br from-gray-800 via-amber-950/30 to-gray-900 shadow-lg">
              <div className="w-full h-full bg-gradient-to-br from-amber-900/20 to-black/40"></div>
            </div>

            {/* Record Button (center) - One Ummah gold ring with red center */}
            <button
              onClick={startRecording}
              className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center hover:scale-105 transition-all shadow-[0_0_40px_rgba(251,191,36,0.5)] border-2 border-amber-300/50"
            >
              <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.6)]"></div>
              </div>
            </button>

            {/* Flip Camera (right) - Gold accent */}
            <button
              onClick={flipCamera}
              disabled={isRecording}
              className="w-12 h-12 rounded-full bg-black/70 backdrop-blur-md border border-amber-500/30 flex items-center justify-center hover:bg-black/80 hover:border-amber-400/50 transition-all disabled:opacity-50"
            >
              <RotateCw className="w-6 h-6 text-amber-300" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
