import { useEffect, useRef, useState } from 'react';
import { X, RotateCw, Check, RotateCcw, Play, Pause, Sparkles, Clock } from 'lucide-react';
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

  // Start camera
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
        video: { facingMode: cameraFacing, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsLoadingCamera(false);
    } catch (err: any) {
      console.error('Camera error:', err);
      setError(err.message || 'Failed to access camera.');
      setIsLoadingCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const flipCamera = () => {
    setCameraFacing((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

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
          if (onPhotoTaken) onPhotoTaken(blob);
          onClose();
        }
      } catch (err) {
        alert('Failed to capture photo: ' + (err as Error).message);
      }
      return;
    }

    if (!streamRef.current) return alert('Camera not ready.');

    try {
      chunksRef.current = [];
      setDuration(0);

      const options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported('video/mp4')) options.mimeType = 'video/mp4';
      else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) options.mimeType = 'video/webm;codecs=vp9';
      else options.mimeType = 'video/webm';

      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: options.mimeType || 'video/mp4' });
        const url = URL.createObjectURL(blob);
        setRecordedVideo({ blob, url });
        chunksRef.current = [];
      };

      mediaRecorder.start();
      setIsRecording(true);

      const interval = setInterval(() => {
        setDuration((prev) => {
          if (videoType === 'littles' && prev + 1 >= 180) {
            stopRecording();
            return prev + 1;
          }
          return prev + 1;
        });
      }, 1000);
      (mediaRecorder as any).durationInterval = interval;
    } catch (err) {
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
    if (recordedVideo && onVideoRecorded) onVideoRecorded(recordedVideo.blob);
    onClose();
  };

  const togglePlayPause = () => {
    if (previewVideoRef.current) {
      if (isPlaying) previewVideoRef.current.pause();
      else previewVideoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const takePhoto = async () => {
    if (!videoRef.current) return alert('Camera not ready.');

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (cameraFacing === 'user') {
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
    } else {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    }

    canvas.toBlob((blob) => {
      if (blob && onPhotoTaken) {
        onPhotoTaken(blob);
        onClose();
      }
    }, 'image/jpeg', 0.95);
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Preview screen
  if (recordedVideo) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <video ref={previewVideoRef} src={recordedVideo.url} autoPlay loop playsInline className="w-full h-full object-cover" />
        <button onClick={togglePlayPause} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 p-4 rounded-full z-50">
          {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white" />}
        </button>
        <div className="absolute bottom-8 left-0 right-0 flex justify-between px-8 z-50">
          <button onClick={retakeVideo} className="bg-white/20 p-4 rounded-full">
            <RotateCcw className="w-6 h-6 text-white" />
          </button>
          <button onClick={confirmVideo} className="bg-amber-500 px-8 py-4 rounded-full flex items-center gap-2">
            <Check className="w-6 h-6 text-white" />
            <span className="text-white font-semibold">Use Video</span>
          </button>
        </div>
      </div>
    );
  }

  // Main camera
  return (
    <div className="fixed inset-0 bg-black z-50">
      {isLoadingCamera && !error && <p className="text-white">Starting Camera...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`} />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex justify-between p-4 z-50">
        <button onClick={onClose} className="p-3 rounded-full bg-black/50">
          <X className="w-6 h-6 text-white" />
        </button>
        <div className="flex gap-2 bg-black/50 rounded-full p-1">
          <button onClick={() => setMode('VIDEO')} className={mode === 'VIDEO' ? 'bg-amber-500 text-white px-6 py-2 rounded-full' : 'text-white/70 px-6 py-2 rounded-full'}>VIDEO</button>
          <button onClick={() => setMode('PHOTO')} className={mode === 'PHOTO' ? 'bg-amber-500 text-white px-6 py-2 rounded-full' : 'text-white/70 px-6 py-2 rounded-full'}>PHOTO</button>
        </div>
        <button onClick={flipCamera} disabled={isRecording} className="p-4 rounded-full bg-black/50">
          <RotateCw className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* Recording button */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <button onClick={isRecording ? stopRecording : startRecording} disabled={!streamRef.current} className="w-20 h-20 rounded-full border-4 border-red-500 flex items-center justify-center">
          <div className={isRecording ? 'w-8 h-8 bg-white rounded-sm' : 'w-16 h-16 bg-red-500 rounded-full'} />
        </button>
      </div>
    </div>
  );
}
