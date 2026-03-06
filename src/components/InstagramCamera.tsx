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
      stopCamera();
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setError('Failed to access camera. Please allow camera permissions.');
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
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        onVideoRecorded(blob, videoType);
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

  const startOver = () => {
    if (isRecording) {
      const interval = (mediaRecorderRef.current as any).durationInterval;
      if (interval) clearInterval(interval);
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      setDuration(0);
      chunksRef.current = [];
    }
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
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-red-400 text-xl mb-4">{error}</p>
          <button
            onClick={onClose}
            className="bg-amber-500 text-white px-6 py-3 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Video Preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
        style={{ objectPosition: 'center center' }}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent pb-6 z-10">
        <div className="flex justify-between items-center p-4">
          <button
            onClick={onClose}
            className="p-3 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={flipCamera}
            disabled={isRecording}
            className="p-3 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-all disabled:opacity-50"
          >
            <RotateCw className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Littles / Length Selector */}
        {!isRecording && (
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={() => setVideoType('littles')}
              className={`px-6 py-2 rounded-full backdrop-blur-sm transition-all ${
                videoType === 'littles'
                  ? 'bg-white/20 border-2 border-white shadow-lg shadow-white/20'
                  : 'bg-black/30 border border-white/30'
              }`}
            >
              <span className={`font-bold tracking-wider ${
                videoType === 'littles' ? 'text-white text-lg' : 'text-gray-400 text-base'
              }`} style={{ fontFamily: 'cursive' }}>
                Littles
              </span>
            </button>

            <button
              onClick={() => setVideoType('length')}
              className={`px-6 py-2 rounded-full backdrop-blur-sm transition-all ${
                videoType === 'length'
                  ? 'bg-green-400/20 border-2 border-green-300 shadow-lg shadow-green-300/20'
                  : 'bg-black/30 border border-green-300/30'
              }`}
            >
              <span className={`font-bold tracking-wider ${
                videoType === 'length' ? 'text-green-300 text-lg' : 'text-gray-400 text-base'
              }`} style={{ fontFamily: 'cursive' }}>
                Length
              </span>
            </button>
          </div>
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <div className="flex justify-center items-center gap-3 mt-4">
            <div className="flex items-center gap-2 bg-red-600/90 backdrop-blur-sm px-4 py-2 rounded-full">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="text-white font-bold text-xl tracking-widest" style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>
                REC
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Timer & Max Duration */}
      <div className="absolute top-32 left-0 right-0 flex justify-center z-10">
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
