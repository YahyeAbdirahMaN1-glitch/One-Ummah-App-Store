import { useEffect, useRef, useState } from 'react';
import { X, RotateCw, Clock, Sparkles, Play, Pause, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PrayerCameraProps {
  onClose: () => void;
  onVideoRecorded: (blob: Blob, type: 'littles' | 'length') => void;
}

type VideoType = 'littles' | 'length';

export default function PrayerCamera({ onClose, onVideoRecorded }: PrayerCameraProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
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
  const [isPlaying, setIsPlaying] = useState(true);

  // Lock body scroll
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalStyle; };
  }, []);

  // Start camera
  useEffect(() => { if (!isRecording) startCamera(); return () => stopCamera(); }, [cameraFacing]);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);
      stopCamera();

      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera not supported on this device.');
        setIsLoading(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.style.display = 'block';
        videoRef.current.style.opacity = '1';
        videoRef.current.onloadedmetadata = async () => {
          await videoRef.current?.play();
          setIsLoading(false);
        };
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to access camera. Check permissions.');
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  };

  const flipCamera = () => setCameraFacing(prev => prev === 'user' ? 'environment' : 'user');

  const startRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    setDuration(0);

    const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm', videoBitsPerSecond: 2500000 });
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);

    const interval = setInterval(() => {
      setDuration(prev => {
        const next = prev + 1;
        if ((videoType === 'littles' && next >= 30) || (videoType === 'length' && next >= 60)) stopRecording();
        return next;
      });
    }, 1000);
    (recorder as any).durationInterval = interval;
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    clearInterval((mediaRecorderRef.current as any).durationInterval);
    mediaRecorderRef.current.stop();
    setIsRecording(false);

    setTimeout(() => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      if (blob.size === 0) { alert('Recording failed.'); return; }
      setRecordedBlob(blob);
    }, 100);
  };

  const discardVideo = () => {
    setRecordedBlob(null);
    setDuration(0);
    chunksRef.current = [];
  };

  const startOver = () => {
    isStartingOverRef.current = true;
    if (isRecording && mediaRecorderRef.current) stopRecording();
    setRecordedBlob(null);
    setDuration(0);
    chunksRef.current = [];
    startRecording();
  };

  const postVideo = () => {
    if (recordedBlob) {
      onVideoRecorded(recordedBlob, videoType);
      stopCamera();
      onClose();
    } else alert('No video recorded.');
  };

  const togglePlayPause = () => {
    if (previewRef.current) {
      if (isPlaying) previewRef.current.pause(); else previewRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const formatDuration = (sec: number) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
  const getMaxDuration = () => (videoType === 'littles' ? '0:30' : '1:00');

  if (error) return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md text-white">
        <p>{error}</p>
        <button onClick={startCamera} className="bg-amber-500 px-6 py-3 rounded-lg m-2">Try Again</button>
        <button onClick={onClose} className="bg-gray-700 px-6 py-3 rounded-lg m-2">Close</button>
      </div>
    </div>
  );

  if (isLoading) return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center text-white">
      <div className="animate-spin h-20 w-20 border-b-4 border-amber-500 rounded-full mb-4"></div>
      Starting Camera...
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black z-[9999] overflow-hidden">
      {/* Video */}
      <video ref={recordedBlob ? previewRef : videoRef} autoPlay playsInline muted={!recordedBlob} loop={!!recordedBlob} className="absolute inset-0 w-full h-full object-cover" style={{ display: 'block' }} />
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex justify-between p-4 z-50 bg-gradient-to-b from-black/90 to-transparent">
        <button onClick={() => navigate(-1)} className="p-3 rounded-full bg-black/70"><X className="w-6 h-6 text-white" /></button>
        <button onClick={flipCamera} disabled={isRecording} className="p-3 rounded-full bg-black/70 disabled:opacity-50"><RotateCw className="w-6 h-6 text-white" /></button>
      </div>

      {/* Mode selector */}
      {!isRecording && !recordedBlob && (
        <div className="absolute top-20 left-0 right-0 flex justify-center gap-4 z-50">
          <button onClick={() => setVideoType('littles')} className={`px-6 py-4 rounded-2xl ${videoType === 'littles' ? 'bg-white text-black' : 'bg-black text-white'}`}>LITTLES</button>
          <button onClick={() => setVideoType('length')} className={`px-6 py-4 rounded-2xl ${videoType === 'length' ? 'bg-green-400 text-black' : 'bg-black text-green-400'}`}>LENGTH</button>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-8 pt-6 flex justify-center gap-8 z-50">
        {!isRecording && !recordedBlob && <button onClick={startRecording} className="w-24 h-24 rounded-full bg-red-500"></button>}
        {isRecording && <button onClick={stopRecording} className="w-24 h-24 rounded-full bg-red-700"></button>}
        {recordedBlob && <>
          <button onClick={discardVideo} className="w-20 h-20 rounded-full bg-gray-700">Retake</button>
          <button onClick={postVideo} className="w-24 h-24 rounded-full bg-amber-500">Use Video</button>
          <button onClick={startOver} className="w-20 h-20 rounded-full bg-green-500">Start Over</button>
        </>}
      </div>

      {/* Duration Indicator */}
      {isRecording && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black/70 px-4 py-2 rounded-full z-50 text-white font-semibold">
          REC {formatDuration(duration)} / {getMaxDuration()}
        </div>
      )}
    </div>
  );
}
