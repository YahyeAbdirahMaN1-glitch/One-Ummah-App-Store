import { useState } from 'react';
import { X, RotateCcw, Check, Play, Pause, Sparkles, Clock } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { VideoCapture } from '@capacitor-community/video-capture';

interface SimpleCameraProps {
  onClose: () => void;
  onVideoRecorded?: (blob: Blob) => void;
  onPhotoTaken?: (blob: Blob) => void;
}

type Mode = 'VIDEO' | 'PHOTO';
type VideoType = 'littles' | 'length';

export default function SimpleCamera({ onClose, onVideoRecorded, onPhotoTaken }: SimpleCameraProps) {
  const [mode, setMode] = useState<Mode>('VIDEO');
  const [videoType, setVideoType] = useState<VideoType>('littles');
  const [recordedVideo, setRecordedVideo] = useState<{ blob: Blob; url: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  // Take photo using Capacitor Camera API
  const takePhoto = async () => {
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
        if (onPhotoTaken) {
          onPhotoTaken(blob);
          onClose();
        }
      }
    } catch (err) {
      console.error('Photo capture error:', err);
      alert('Failed to capture photo: ' + (err as Error).message);
    }
  };

  // Capture video using Capacitor native plugin
  const captureVideo = async () => {
    try {
      const duration = videoType === 'littles' ? 15 : 0; // 0 = unlimited
      const result = await VideoCapture.captureVideo({
        quality: 'high',
        duration,
      });

      if (result.videos.length > 0) {
        const videoFile = result.videos[0];
        const response = await fetch(videoFile.path);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setRecordedVideo({ blob, url });
      }
    } catch (err) {
      console.error('Video capture failed:', err);
      alert('Video capture failed: ' + (err as Error).message);
    }
  };

  const retakeVideo = () => {
    if (recordedVideo) {
      URL.revokeObjectURL(recordedVideo.url);
    }
    setRecordedVideo(null);
  };

  const confirmVideo = () => {
    if (recordedVideo && onVideoRecorded) {
      onVideoRecorded(recordedVideo.blob);
      onClose();
    }
  };

  const togglePlayPause = () => {
    const videoEl = document.getElementById('preview-video') as HTMLVideoElement;
    if (videoEl) {
      if (isPlaying) videoEl.pause();
      else videoEl.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 w-full h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex justify-between p-4 bg-black/70 backdrop-blur-sm">
        <button onClick={onClose} className="p-2 bg-black/50 rounded-full">
          <X className="w-6 h-6 text-white" />
        </button>

        <div className="flex gap-2 bg-black/50 rounded-full p-1">
          <button
            onClick={() => setMode('VIDEO')}
            className={`px-4 py-1 rounded-full font-medium ${
              mode === 'VIDEO' ? 'bg-amber-500 text-white' : 'text-white/70'
            }`}
          >
            VIDEO
          </button>
          <button
            onClick={() => setMode('PHOTO')}
            className={`px-4 py-1 rounded-full font-medium ${
              mode === 'PHOTO' ? 'bg-amber-500 text-white' : 'text-white/70'
            }`}
          >
            PHOTO
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center">
        {/* Video preview */}
        {recordedVideo ? (
          <div className="relative w-full h-full">
            <video
              id="preview-video"
              src={recordedVideo.url}
              autoPlay
              loop
              playsInline
              className="w-full h-full object-cover"
            />

            <button
              onClick={togglePlayPause}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 p-4 rounded-full"
            >
              {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white" />}
            </button>
          </div>
        ) : (
          <p className="text-white text-sm">Tap button below to {mode === 'PHOTO' ? 'take photo' : 'record video'}</p>
        )}
      </div>

      {/* Bottom controls */}
      <div className="p-4 bg-black/80 backdrop-blur-sm flex flex-col items-center gap-4">
        {/* Video type toggle */}
        {mode === 'VIDEO' && !recordedVideo && (
          <div className="flex gap-4 mb-2">
            <button
              onClick={() => setVideoType('littles')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                videoType === 'littles' ? 'bg-white/20 text-white' : 'bg-black/30 text-gray-400'
              }`}
            >
              <Sparkles className="w-5 h-5" /> Littles
            </button>

            <button
              onClick={() => setVideoType('length')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                videoType === 'length' ? 'bg-white/20 text-white' : 'bg-black/30 text-gray-400'
              }`}
            >
              <Clock className="w-5 h-5" /> Length
            </button>
          </div>
        )}

        {/* Main capture button */}
        {!recordedVideo ? (
          <button
            onClick={mode === 'PHOTO' ? takePhoto : captureVideo}
            className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center"
          >
            {mode === 'PHOTO' ? <div className="w-16 h-16 bg-white rounded-full" /> : <div className="w-16 h-16 rounded-full bg-white" />}
          </button>
        ) : (
          <div className="flex gap-4">
            <button
              onClick={retakeVideo}
              className="px-6 py-3 bg-gray-700 text-white rounded-full"
            >
              Start Over
            </button>
            <button
              onClick={confirmVideo}
              className="px-6 py-3 bg-amber-500 text-white rounded-full"
            >
              Post
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
