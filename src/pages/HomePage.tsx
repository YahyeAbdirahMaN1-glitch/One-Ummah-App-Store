import { useState } from 'react';
import { Video, Image as ImageIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import SimpleCamera from '../components/SimpleCamera';
import { toast } from 'sonner';

export default function HomePage() {
  const [showCamera, setShowCamera] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<Blob | null>(null);

  const handleVideoRecorded = (blob: Blob) => {
    setRecordedVideo(blob);
    toast.success('Video recorded! Add a caption and post.');
  };

  const handlePhotoTaken = (blob: Blob) => {
    setCapturedPhoto(blob);
    toast.success('Photo captured! Add a caption and post.');
  };

  const handlePost = async () => {
    if (!postContent.trim() && !recordedVideo && !capturedPhoto) {
      toast.error('Please add content, a video, or a photo');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('content', postContent);
      
      if (recordedVideo) {
        formData.append('video', recordedVideo, 'video.mp4');
      }
      
      if (capturedPhoto) {
        formData.append('photo', capturedPhoto, 'photo.jpg');
      }

      const response = await fetch('/api/posts/create', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to create post');

      toast.success('Post created successfully!');
      setPostContent('');
      setRecordedVideo(null);
      setCapturedPhoto(null);
    } catch (error) {
      toast.error('Failed to create post');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-amber-950/30 to-black border-amber-900/30 p-6">
        <h2 className="text-xl font-bold text-amber-400 mb-4">Create Post</h2>
        
        <Textarea
          placeholder="Share your thoughts with the Ummah..."
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
          className="bg-black/50 border-amber-900/30 text-white placeholder:text-gray-500 mb-4 min-h-[100px]"
        />

        {recordedVideo && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-amber-400 text-sm">✓ Video attached</p>
          </div>
        )}

        {capturedPhoto && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-amber-400 text-sm">✓ Photo attached</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={() => setShowCamera(true)}
            className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
          >
            <Video className="w-5 h-5 mr-2" />
            Record
          </Button>

          <Button
            onClick={handlePost}
            className="flex-1 bg-white text-black hover:bg-gray-100"
          >
            Post
          </Button>
        </div>
      </Card>

      <div className="text-center text-gray-500 py-8">
        <p>Your posts will appear here</p>
        <p className="text-sm mt-2">Share moments with the One Ummah community</p>
      </div>

      {showCamera && (
        <SimpleCamera
          onClose={() => setShowCamera(false)}
          onVideoRecorded={handleVideoRecorded}
          onPhotoTaken={handlePhotoTaken}
        />
      )}
    </div>
  );
}
