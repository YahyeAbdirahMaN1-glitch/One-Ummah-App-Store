import { useEffect, useRef, useState } from 'react';
import { X, RotateCw, Check, RotateCcw, Play, Pause, Sparkles, Clock, Camera as CameraIcon } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

interface SimpleCameraProps {
  onClose: () => void;
  onVideoRecorded?: (blob: Blob) => void;
  onPhotoTaken?: (blob: Blob) => void;
}

type Mode = 'VIDEO' | 'PHOTO';
type VideoType = 'littles' | 'length';
type CameraFacing = 'user' | 'environment';

export default function SimpleCamera({ onClose, onVideoRecorded, onPhotoTaken }: SimpleCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [mode, setMode] = useState<Mode>('VIDEO');
  const [videoType, setVideoType] = useState<VideoType>('littles');
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>('user');
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordedVideo, setRecordedVideo] = useState<{ blob: Blob; url: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoadingCamera, setIsLoadingCamera] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lock body scroll
  useEffect(() => {
    const originalStyle = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      width: document.body.style.width,
      height: document.body.style.height,
    };
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    return () => {
      document.body.style.overflow = originalStyle.overflow;
      document.body.style.position = originalStyle.position;
      document.body.style.width = originalStyle.width;
      document.body.style.height = originalStyle.height;
    };
  }, []);

  // Start camera on mount or facing change
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [cameraFacing]);

  const startCamera = async () => {
    setIsLoadingCamera(true);
    setError(null);

    try {
      stopCamera();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported. Please update your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');

        await new Promise((resolve, reject) => {
          if (!videoRef.current) return reject('Video ref lost');
          videoRef.current.onloadedmetadata = () => resolve(true);
          videoRef.current.onerror = () => reject('Video element error');
          setTimeout(() => reject('Timeout waiting for video'), 5000);
        });

        await videoRef.current.play();
      }

      setIsLoadingCamera(false);
    } catch (err: any) {
      console.error('[iOS Camera] Error:', err);
      let errorMessage = 'Failed to access camera';

      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please enable Camera and Microphone in Settings.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use. Close other apps and try again.';
      } else if (err === 'Timeout waiting for video') {
        errorMessage = 'Camera is taking too long to start. Check your internet and try again.';
      } else {
        errorMessage = err.message || 'Unknown camera error. Restart app and try again.';
      }

      setError(errorMessage);
      setIsLoadingCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const flipCamera = () => setCameraFacing(prev => (prev === 'user' ? 'environment' : 'user'));

  const startRecording = async () => {
    if (mode === 'PHOTO') {
      try {
        const result = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Camera,
        });

        if (result.webPath) {
          const response = await fetch(result.webPath);
          const blob = await response.blob();
          onPhotoTaken?.(blob);
          onClose();
        }
      } catch (err) {
        console.error(err);
        alert('Failed to capture photo: ' + (err as Error).message);
      }
      return;
    }

    if (!streamRef.current) {
      alert('Camera not ready. Please wait.');
      return;
    }

    try {
      chunksRef.current = [];
      setDuration(0);

      // MediaRecorder compatibility for iOS
      let options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        options.mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        options.mimeType = 'video/webm;codecs=vp9';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        options.mimeType = 'video/webm';
      }

      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'video/mp4' });
        const url = URL.createObjectURL(blob);
        setRecordedVideo({ blob, url });
        chunksRef.current = [];
      };

      mediaRecorder.start();
      setIsRecording(true);

      const interval = setInterval(() => setDuration(prev => prev + 1), 1000);
      (mediaRecorder as any).durationInterval = interval;
    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('Failed to start recording: ' + (err as Error).message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      const interval = (mediaRecorderRef.current as any).durationInterval;
      if (interval) clearInterval(interval);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const retakeVideo = () => {
    if (recordedVideo) URL.revokeObjectURL(recordedVideo.url);
    setRecordedVideo(null);
    setDuration(0);
    startCamera();
  };

  const confirmVideo = () => {
    if (recordedVideo && onVideoRecorded) {
      onVideoRecorded(recordedVideo.blob);
      onClose();
    }
  };

  const togglePlayPause = () => {
    if (previewVideoRef.current) {
      if (isPlaying) previewVideoRef.current.pause();
      else previewVideoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const takePhoto = async () => {
    if (!videoRef.current || !streamRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (cameraFacing === 'user') ctx.scale(-1, 1), ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
    else ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
      if (blob && onPhotoTaken) {
        onPhotoTaken(blob);
        onClose();
      }
    }, 'image/jpeg', 0.95);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Video preview
  if (recordedVideo) {
    return (
      <div className="fixed inset-0 bg-black z-50 w-screen h-screen overflow-hidden">
        <video ref={previewVideoRef} src={recordedVideo.url} autoPlay loop playsInline className="w-full h-full object-cover" />
        <div className="absolute top-4 left-0 right-0 flex justify-center z-50">
          <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
            <p className="text-white text-sm font-medium">{formatDuration(duration)}</p>
          </div>
        </div>

        <button onClick={togglePlayPause} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm p-4 rounded-full z-50">
          {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white" />}
        </button>

        <div className="absolute bottom-8 left-0 right-0 flex justify-between items-center px-8 z-50">
          <button onClick={retakeVideo} className="bg-white/20 backdrop-blur-sm p-4 rounded-full border-2 border-white/20 hover:bg-white/30 transition-all">
            <RotateCcw className="w-6 h-6 text-white" />
          </button>
          <button onClick={confirmVideo} className="bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 rounded-full flex items-center gap-2 shadow-lg hover:scale-105 transition-all">
            <Check className="w-6 h-6 text-white" />
            <span className="text-white font-semibold">Use Video</span>
          </button>
        </div>
      </div>
    );
  }

  // Main camera view
  return (
    <div className="fixed inset-0 bg-black z-50 w-screen h-screen overflow-hidden">
      {/* Loading */}
      {isLoadingCamera && !error && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50">
          <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-amber-400 mb-4"></div>
          <p className="text-white text-2xl font-semibold mb-2">Starting Camera...</p>
          <p className="text-gray-400 text-sm">Tap Allow when your browser asks</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50 p-8">
          <div className="bg-red-500/20 p-6 rounded-full mb-6">
            <X className="w-20 h-20 text-red-500" />
          </div>
          <h2 className="text-white text-2xl font-bold mb-4">Camera Access Required</h2>
          <p className="text-gray-300 text-center mb-8 max-w-md">{error}</p>
          <div className="flex gap-4">
            <button onClick={onClose} className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all">Close Camera</button>
            <button onClick={startCamera} className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all">Try Again</button>
          </div>
        </div>
      )}

      {/* Camera view */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        controls={false}
        className={`absolute inset-0 w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
        style={{ objectPosition: 'center center' }}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/85 via-amber-950/30 to-transparent z-50 pb-6">
        <div className="flex items-center justify-between px-4 py-4">
          <button onClick={onClose} className="p-3 rounded-full bg-black/50 backdrop-blur-sm border border-amber-900/30 hover:bg-black/70 transition-all">
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="flex gap-2 bg-black/50 backdrop-blur-sm rounded-full p-1">
            <button onClick={() => setMode('VIDEO')} className={`px-6 py-2 rounded-full font-medium transition-all ${mode === 'VIDEO' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg' : 'text-white/70 hover:text-white'}`}>VIDEO</button>
            <button onClick={() => setMode('PHOTO')} className={`px-6 py-2 rounded-full font-medium transition-all ${mode === 'PHOTO' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg' : 'text-white/70 hover:text-white'}`}>PHOTO</button>
          </div>
          <button onClick={flipCamera} disabled={isRecording} className="p-4 rounded-full bg-black/50 backdrop-blur-sm border-2 border-white/20 hover:bg-black/70 transition-all disabled:opacity-50 shadow-lg shadow-black/50">
            <RotateCw className="w-7 h-7 text-white" />
          </button>
        </div>

        {mode === 'VIDEO' && !isRecording && (
          <div className="flex justify-center gap-4 mt-4">
            <button onClick={() => setVideoType('littles')} className={`flex items-center gap-2 px-6 py-3 rounded-xl backdrop-blur-sm transition-all ${videoType === 'littles' ? 'bg-white/20 border-2 border-white text-white shadow-lg shadow-white/20' : 'bg-black/20 border border-gray-600 text-gray-400'}`}>
              <Sparkles className="w-5 h-5" /><span className="font-medium">Littles</span>
            </button>
            <button onClick={() => setVideoType('length')} className={`flex items-center gap-2 px-6 py-3 rounded-xl backdrop-blur-sm transition-all ${videoType === 'length' ? 'bg-green-300/20 border-2 border-green-300 text-green-300 shadow-lg shadow-green-300/20' : 'bg-black/20 border border-gray-600 text-gray-400'}`}>
              <Clock className="w-5 h-5" /><span className="font-medium">Length</span>
            </button>
          </div>
        )}
      </div>

      {/* Recording */}
      {isRecording && (
        <div className="absolute top-24 left-0 right-0 flex justify-center z-40">
          <div className="bg-gradient-to-r from-red-500/90 to-red-600/90 backdrop-blur-sm px-6 py-2 rounded-full flex items-center gap-3 shadow-lg">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="text-white font-semibold text-lg tracking-wider antialiased">REC {formatDuration(duration)}</span>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-amber-950/20 to-transparent pb-8 pt-12 z-40">
        <div className="flex justify-center items-center">
          {mode === 'VIDEO' ? (
            <button onClick={isRecording ? stopRecording : startRecording} disabled={!streamRef.current} className="relative group disabled:opacity-30">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all hover:scale-105 ${isRecording ? 'border-4 border-red-500' : 'border-4 border-white'}`}>
                <div className={`rounded-sm transition-all ${isRecording ? 'w-8 h-8 bg-white' : 'w-16 h-16 bg-red-500 rounded-full'}`} />
              </div>
            </button>
          ) : (
            <button onClick={takePhoto} disabled={!streamRef.current} className="relative group disabled:opacity-30">
              <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 transition-all">
                <div className="w-16 h-16 bg-white rounded-full" />
              </div>
            </button>
          )}
        </div>

        <div className="text-center mt-4">
          {!streamRef.current && !isLoadingCamera && !error && <p className="text-amber-400 text-sm animate-pulse">Waiting for camera access...</p>}
          {mode === 'VIDEO' && !isRecording && streamRef.current && (
            <p className="text-white/70 text-sm">{videoType === 'littles' ? 'Tap to record short video (15s-3min)' : 'Tap to record long video (3min+)'}</p>
          )}
          {mode === 'PHOTO' && streamRef.current && <p className="text-white/70 text-sm">Tap to capture photo</p>}
        </div>
      </div>
    </div>
  );
}
