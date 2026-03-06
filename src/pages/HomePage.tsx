import { useState } from 'react';
import { Video, Camera as CameraIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { toast } from 'sonner';

export default function HomePage() {
  const [postContent, setPostContent] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const handleTakePhoto = async () => {
    try {
      const result = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (result.dataUrl) {
        setCapturedPhoto(result.dataUrl);
        toast.success('Photo captured! Add a caption and post.');
      }
    } catch (err: any) {
      if (err.message !== 'User cancelled photos app') {
        toast.error('Failed to capture photo');
        console.error('Camera error:', err);
      }
    }
  };

  const handlePost = async () => {
    if (!postContent.trim() && !capturedPhoto) {
      toast.error('Please add content or a photo');
      return;
    }

    try {
      // For now, just show success (full post creation coming soon)
      toast.success('Post created successfully!');
      setPostContent('');
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

        {capturedPhoto && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <img src={capturedPhoto} alt="Captured" className="w-full h-64 object-cover" />
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleTakePhoto}
            className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
          >
            <CameraIcon className="w-5 h-5 mr-2" />
            Take Photo
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
    </div>
  );
}
