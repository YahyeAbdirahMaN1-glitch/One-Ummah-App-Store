import { useState, useEffect, useRef } from 'react';
import { X, RotateCw, Play, Pause, Sparkles, Clock } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {
  VideoRecorder,
  RecordingOptions
} from '@capacitor-community/video-recorder';

interface SimpleCameraProps {
  onClose: () => void;
  onVideoRecorded?: (filePath: string) => void;
  onPhotoTaken?: (filePath: string) => void;
}

type Mode = 'VIDEO' | 'PHOTO';
type VideoType = 'littles' | 'length';

export default function SimpleCamera({ onClose, onVideoRecorded, onPhotoTaken }: SimpleCameraProps) {
  const [mode, setMode] = useState<Mode>('VIDEO');
  const [videoType, setVideoType] = useState<VideoType>('littles');
  const [recording, setRecording] = useState(false);
  const [recordedFilePath, setRecordedFilePath] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const durationTimer = useRef<NodeJS.Timer | null>(null);

  // Update duration counter
  const startDurationCounter = () => {
    setDuration(0);
    durationTimer.current = setInterval(() => setDuration((d) => d + 1), 1000);
  };

  const stopDurationCounter = () => {
    if (durationTimer.current) clearInterval(durationTimer.current);
  };

  // Takes a photo — leave this as-is
  const takePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      const filePath = photo.path || photo.webPath || '';
      if (onPhotoTaken) onPhotoTaken(filePath);
      onClose();
    } catch (err) {
      console.error('Photo capture error', err);
    }
  };

  // Starts native iOS recording
  const startVideoRecording = async () => {
    try {
      startDurationCounter();
      setRecording(true);

      const options: RecordingOptions = {
        quality: 'high',
        frontCamera: false,
        saveToGallery: false, // you can enable if desired
      };

      await VideoRecorder.prepareRecording(options);
      await VideoRecorder.startRecording();
    } catch (err) {
      console.error('Start recording error', err);
    }
  };

  // Stops native iOS recording
  const stopVideoRecording = async () => {
    try {
      const result = await VideoRecorder.stopRecording();
      stopDurationCounter();
      setRecording(false);

      if (result && result.value?.uri) {
        setRecordedFilePath(result.value.uri);
      }
    } catch (err) {
      console.error('Stop recording error', err);
    }
  };

  // Retake video
  const retakeVideo = () => {
    setRecordedFilePath(null);
    setDuration(0);
  };

  // Confirm video (send back to parent)
  const confirmVideo = () => {
    if (recordedFilePath && onVideoRecorded) onVideoRecorded(recordedFilePath);
    onClose();
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/50">
        <button onClick={onClose} className="p-2 bg-black/40 rounded-full">
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Recap & Preview */}
      {recordedFilePath ? (
        <>
          <video
            src={recordedFilePath}
            controls
            className="w-full h-full object-cover"
          />
          <div className="p-4">
            <button
              onClick={retakeVideo}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg"
            >
              Start Over
            </button>
            <button
              onClick={confirmVideo}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg ml-4"
            >
              Post
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Recording UI */}
          <div className="text-center text-white my-4">
            {recording && <p>Recording ‼️ {formatDuration(duration)}</p>}
          </div>

          {/* Action Button */}
          <div className="flex justify-center items-center p-4">
            {mode === 'VIDEO' ? (
              <button
                onClick={recording ? stopVideoRecording : startVideoRecording}
                className={`w-20 h-20 rounded-full ${recording ? 'bg-white' : 'bg-red-500'}`}
              />
            ) : (
              <button
                onClick={takePhoto}
                className="w-20 h-20 rounded-full bg-white"
              />
            )}
          </div>

          {/* Mode Tabs */}
          <div className="flex justify-center gap-4 px-4">
            <button
              onClick={() => setMode('VIDEO')}
              className={`px-4 py-2 rounded-full ${
                mode === 'VIDEO' ? 'bg-amber-500 text-white' : 'text-white/70'
              }`}
            >
              VIDEO
            </button>
            <button
              onClick={() => setMode('PHOTO')}
              className={`px-4 py-2 rounded-full ${
                mode === 'PHOTO' ? 'bg-amber-500 text-white' : 'text-white/70'
              }`}
            >
              PHOTO
            </button>
          </div>

          {/* Littles / Length */}
          {mode === 'VIDEO' && !recording && (
            <div className="flex justify-center gap-4 my-4">
              <button
                onClick={() => setVideoType('littles')}
                className={`px-3 py-2 rounded-full ${
                  videoType === 'littles'
                    ? 'bg-white text-black'
                    : 'bg-black/30 text-white'
                }`}
              >
                Littles
              </button>
              <button
                onClick={() => setVideoType('length')}
                className={`px-3 py-2 rounded-full ${
                  videoType === 'length'
                    ? 'bg-white text-black'
                    : 'bg-black/30 text-white'
                }`}
              >
                Length
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
