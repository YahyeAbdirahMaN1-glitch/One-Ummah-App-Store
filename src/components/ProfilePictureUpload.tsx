import { useRef, useState } from 'react';
import { Camera, Upload, User } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface ProfilePictureUploadProps {
  currentPicture: string | null;
  gender: string;
  onUpload: (imageData: string) => void;
}

export default function ProfilePictureUpload({ 
  currentPicture, 
  gender, 
  onUpload 
}: ProfilePictureUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPicture);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isWoman = gender === 'female' || gender === 'woman';

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsProcessing(true);

    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Set canvas size (square, 400x400)
          const size = 400;
          canvas.width = size;
          canvas.height = size;

          // Draw image (centered and cropped to square)
          const scale = Math.max(size / img.width, size / img.height);
          const x = (size - img.width * scale) / 2;
          const y = (size - img.height * scale) / 2;
          
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

          // Apply hijab overlay for women
          if (isWoman) {
            applyHijabOverlay(ctx, size);
          }

          // Convert to base64
          const imageData = canvas.toDataURL('image/jpeg', 0.9);
          setPreview(imageData);
          onUpload(imageData);
          toast.success(isWoman ? 'Profile picture uploaded with hijab ✨' : 'Profile picture uploaded');
          setIsProcessing(false);
        };

        img.onerror = () => {
          toast.error('Failed to load image');
          setIsProcessing(false);
        };

        img.src = event.target?.result as string;
      };

      reader.onerror = () => {
        toast.error('Failed to read file');
        setIsProcessing(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Image processing error:', error);
      toast.error('Failed to process image');
      setIsProcessing(false);
    }
  };

  const applyHijabOverlay = (ctx: CanvasRenderingContext2D, size: number) => {
    // Create Islamic-style hijab overlay
    // This draws a simple headscarf frame around the face area
    
    // Save context state
    ctx.save();

    // Create radial gradient for vignette effect (modest blur at edges)
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, size * 0.3,
      size / 2, size / 2, size * 0.6
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Draw hijab fabric overlay (top portion)
    const hijabGradient = ctx.createLinearGradient(0, 0, 0, size * 0.4);
    hijabGradient.addColorStop(0, 'rgba(40, 30, 20, 0.8)'); // Dark brown/black
    hijabGradient.addColorStop(1, 'rgba(40, 30, 20, 0.3)');

    ctx.fillStyle = hijabGradient;
    ctx.fillRect(0, 0, size, size * 0.25); // Top 25%

    // Draw side fabric
    ctx.fillStyle = 'rgba(40, 30, 20, 0.6)';
    ctx.fillRect(0, 0, size * 0.15, size * 0.7); // Left side
    ctx.fillRect(size * 0.85, 0, size * 0.15, size * 0.7); // Right side

    // Add decorative border (subtle gold accent)
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)'; // Amber gold
    ctx.lineWidth = 2;
    
    // Draw elegant frame
    ctx.beginPath();
    ctx.arc(size / 2, size * 0.55, size * 0.35, 0, Math.PI * 2);
    ctx.stroke();

    // Restore context
    ctx.restore();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Preview */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-amber-500 bg-gradient-to-br from-amber-900/50 to-black">
          {preview ? (
            <img 
              src={preview} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-16 h-16 text-amber-400/50" />
            </div>
          )}
        </div>
        
        {isWoman && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs px-3 py-1 rounded-full font-semibold">
            Hijab Mode ✨
          </div>
        )}
      </div>

      {/* Upload Button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Processing...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            {preview ? 'Change Photo' : 'Upload Photo'}
          </span>
        )}
      </Button>

      {isWoman && (
        <p className="text-sm text-amber-300/70 text-center max-w-xs">
          Your photo will automatically include a modest hijab overlay for Islamic modesty 🧕
        </p>
      )}
    </div>
  );
}
