import { useEffect, useRef, useState } from 'react';
import { X, RotateCw, Check, Play, Pause, Sparkles, Clock, Camera as CameraIcon } from 'lucide-react';
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
  const [caption, setCaption] = useState('');

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
        throw new Error('Camera API not supported.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve, reject) => {
          if (!videoRef.current) return reject('Video ref lost');
          videoRef.current.onloadedmetadata = () => resolve(true);
          videoRef.current.onerror = () => reject('Video element error');
          setTimeout(() => reject('Timeout'), 5000);
        });
        await videoRef.current.play();
      }
      setIsLoadingCamera(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unknown camera error');
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
          const blob = await (await fetch(result.webPath)).blob();
          if (onPhotoTaken) onPhotoTaken(blob);
          onClose();
        }
      } catch (err) {
        alert('Failed to capture photo: ' + (err as Error).message);
      }
      return;
    }

    if (!streamRef.current) return alert('Camera not ready');

    try {
      chunksRef.current = [];
      setDuration(0);
      const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm;codecs=vp8,opus' });
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = e => e.data.size && chunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedVideo({ blob, url: URL.createObjectURL(blob) });
        chunksRef.current = [];
      };
      mediaRecorder.start();
      setIsRecording(true);

      const interval = setInterval(() => {
        if (videoType === 'littles' && duration >= 180) stopRecording();
        setDuration(prev => prev + 1);
      }, 1000);
      (mediaRecorder as any).durationInterval = interval;
    } catch (err) {
      alert('Failed to start recording: ' + (err as Error).message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      clearInterval((mediaRecorderRef.current as any).durationInterval);
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
  };

  const togglePlayPause = () => {
    if (previewVideoRef.current) {
      if (isPlaying) previewVideoRef.current.pause();
      else previewVideoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const takePhoto = async () => {
    if (!videoRef.current || !streamRef.current) return alert('Camera not ready');
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (cameraFacing === 'user') ctx.scale(-1, 1), ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
    else ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => blob && onPhotoTaken && (onPhotoTaken(blob), onClose()), 'image/jpeg', 0.95);
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // Video preview + post section
  if (recordedVideo) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <video ref={previewVideoRef} src={recordedVideo.url} autoPlay loop playsInline className="w-full h-full object-cover" />
        <button onClick={retakeVideo} className="absolute top-6 left-4 p-3 bg-black/50 rounded-full">
          <RotateCw className="w-6 h-6 text-white" />
        </button>
        <button onClick={onClose} className="absolute top-6 right-4 p-3 bg-black/50 rounded-full">
          <X className="w-6 h-6 text-white" />
        </button>

        <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center gap-4 px-8">
          <textarea
            placeholder="Add a caption..."
            value={caption}
            onChange={e => setCaption(e.target.value)}
            className="w-full bg-black/60 text-white rounded-lg p-3 placeholder-gray-300"
          />
          <button onClick={confirmVideo} className="bg-amber-500 px-6 py-3 rounded-full text-white font-semibold w-full">Post Video</button>
        </div>
      </div>
    );
  }

  // Main camera view
  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex justify-between p-4 z-50">
        <button onClick={onClose} className="p-3 bg-black/50 rounded-full">
          <X className="w-6 h-6 text-white" />
        </button>
        <button onClick={flipCamera} className="p-3 bg-black/50 rounded-full">
          <RotateCw className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Video element */}
      <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 w-full h-full object-cover ${cameraFacing==='user'?'scale-x-[-1]':''}`} />

      {/* Mode tabs */}
      <div className="absolute bottom-32 left-0 right-0 flex justify-center gap-4 z-50">
        <button onClick={() => setMode('VIDEO')} className={`px-6 py-2 rounded-full ${mode==='VIDEO'?'bg-amber-500 text-white':'bg-black/50 text-white/70'}`}>VIDEO</button>
        <button onClick={() => setMode('PHOTO')} className={`px-6 py-2 rounded-full ${mode==='PHOTO'?'bg-amber-500 text-white':'bg-black/50 text-white/70'}`}>PHOTO</button>
      </div>

      {/* Video type selection */}
      {mode==='VIDEO' && !isRecording && (
        <div className="absolute bottom-56 left-0 right-0 flex justify-center gap-4">
          <button onClick={()=>setVideoType('littles')} className={`px-4 py-2 rounded-lg ${videoType==='littles'?'bg-white/20 text-white':'bg-black/20 text-gray-400'}`}><Sparkles className="w-4 h-4 inline"/> Littles</button>
          <button onClick={()=>setVideoType('length')} className={`px-4 py-2 rounded-lg ${videoType==='length'?'bg-green-300/20 text-green-300':'bg-black/20 text-gray-400'}`}><Clock className="w-4 h-4 inline"/> Length</button>
        </div>
      )}

      {/* Bottom record/photo button */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center z-50">
        {mode==='VIDEO'?(
          <button onClick={isRecording?stopRecording:startRecording} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center">
            <div className={`${isRecording?'w-8 h-8 bg-white rounded-sm':'w-16 h-16 bg-red-500 rounded-full'}`}/>
          </button>
        ):(
          <button onClick={takePhoto} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-full"/>
          </button>
        )}
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute top-24 left-0 right-0 flex justify-center">
          <div className="bg-red-600 px-6 py-2 rounded-full flex items-center gap-2">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="text-white font-semibold">{formatDuration(duration)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
