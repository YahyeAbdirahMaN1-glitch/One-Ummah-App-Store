import { useState, useEffect, useRef } from 'react';
import { Video, Heart, ThumbsDown, Share2, Repeat, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import InstagramCamera from '../components/InstagramCamera';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';

interface Post {
  id: string;
  content: string;
  videoUrl?: string;
  videoType?: 'littles' | 'length';
  likes: number;
  dislikes: number;
  shares: number;
  reposts: number;
  views: number;
  liked: boolean;
  disliked: boolean;
  createdAt: Date;
}

export default function HomePage() {
  const { user } = useAuth();
  const [postContent, setPostContent] = useState('');
  const [recordedVideo, setRecordedVideo] = useState<{ blob: Blob; type: 'littles' | 'length' } | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [viewedPosts, setViewedPosts] = useState<Set<string>>(new Set());
  const postRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handleVideoRecorded = (blob: Blob, type: 'littles' | 'length') => {
    setRecordedVideo({ blob, type });
    setShowCamera(false);
    toast.success(`${type === 'littles' ? 'Littles' : 'Length'} video recorded! Add a caption and post.`);
  };

  const handlePost = async () => {
    if (!postContent.trim() && !recordedVideo) {
      toast.error('Please add content or a video');
      return;
    }

    try {
      const newPost: Post = {
        id: Date.now().toString(),
        content: postContent,
        videoUrl: recordedVideo ? URL.createObjectURL(recordedVideo.blob) : undefined,
        videoType: recordedVideo?.type,
        likes: 0,
        dislikes: 0,
        shares: 0,
        reposts: 0,
        views: 0,
        liked: false,
        disliked: false,
        createdAt: new Date(),
      };

      setPosts([newPost, ...posts]);
      toast.success('Post created successfully!');
      setPostContent('');
      setRecordedVideo(null);
    } catch (error) {
      toast.error('Failed to create post');
      console.error(error);
    }
  };

  const toggleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const wasLiked = post.liked;
        return {
          ...post,
          liked: !wasLiked,
          disliked: false,
          likes: wasLiked ? post.likes - 1 : post.likes + 1,
          dislikes: post.disliked ? post.dislikes - 1 : post.dislikes,
        };
      }
      return post;
    }));
  };

  const toggleDislike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const wasDisliked = post.disliked;
        return {
          ...post,
          disliked: !wasDisliked,
          liked: false,
          dislikes: wasDisliked ? post.dislikes - 1 : post.dislikes + 1,
          likes: post.liked ? post.likes - 1 : post.likes,
        };
      }
      return post;
    }));
  };

  const handleShare = (postId: string) => {
    setPosts(posts.map(post =>
      post.id === postId ? { ...post, shares: post.shares + 1 } : post
    ));
    toast.success('Post shared!');
  };

  const handleRepost = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId ? { ...post, reposts: post.reposts + 1 } : post
    ));
    toast.success('Post reposted!');
  };

  // Track post views with Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const postId = entry.target.getAttribute('data-post-id');
          if (!postId) return;

          // If post is visible and hasn't been viewed yet
          if (entry.isIntersecting && !viewedPosts.has(postId)) {
            // Mark as viewed
            setViewedPosts(prev => new Set([...prev, postId]));
            
            // Increment view count
            setPosts(prev => prev.map(post => 
              post.id === postId ? { ...post, views: post.views + 1 } : post
            ));

            // In a real app, send view to backend here
            // trackPostView(postId, user?.id);
          }
        });
      },
      {
        threshold: 0.5, // Post must be 50% visible to count as viewed
        rootMargin: '0px',
      }
    );

    // Observe all posts
    postRefs.current.forEach((element) => {
      if (element) observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [posts.length, viewedPosts]);

  const setPostRef = (postId: string) => (el: HTMLDivElement | null) => {
    if (el) {
      postRefs.current.set(postId, el);
    } else {
      postRefs.current.delete(postId);
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
          <div className="mb-4 rounded-lg overflow-hidden bg-black/30 border border-amber-900/30">
            <video
              src={URL.createObjectURL(recordedVideo.blob)}
              controls
              className="w-full max-h-96 object-contain"
            />
            <div className="p-3">
              <p className="text-amber-400 text-sm flex items-center gap-2">
                <Video className="w-4 h-4" />
                {recordedVideo.type === 'littles' ? 'Littles' : 'Length'} video attached
              </p>
            </div>
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

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Your posts will appear here</p>
            <p className="text-sm mt-2">Share moments with the One Ummah community</p>
          </div>
        ) : (
          posts.map(post => (
            <Card 
              key={post.id} 
              ref={setPostRef(post.id)}
              data-post-id={post.id}
              className="bg-gradient-to-br from-amber-950/30 to-black border-amber-900/30 p-6"
            >
              {/* Post Content */}
              <p className="text-white mb-4">{post.content}</p>

              {/* Video */}
              {post.videoUrl && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <video
                    src={post.videoUrl}
                    controls
                    className="w-full max-h-96 object-contain bg-black"
                  />
                  {post.videoType && (
                    <div className="bg-black/50 px-3 py-1">
                      <span className={`text-sm font-semibold ${
                        post.videoType === 'littles' ? 'text-white' : 'text-green-300'
                      }`}>
                        {post.videoType === 'littles' ? 'Littles' : 'Length'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Interaction Buttons */}
              <div className="flex items-center justify-between border-t border-amber-900/30 pt-4">
                <div className="flex items-center gap-4">
                  {/* Like */}
                  <button
                    onClick={() => toggleLike(post.id)}
                    className="flex items-center gap-2 group"
                  >
                    <Heart className={`w-5 h-5 transition-all ${
                      post.liked ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover:text-red-500'
                    }`} />
                    <span className={`text-sm ${post.liked ? 'text-red-500' : 'text-gray-400'}`}>
                      {post.likes}
                    </span>
                  </button>

                  {/* Dislike */}
                  <button
                    onClick={() => toggleDislike(post.id)}
                    className="flex items-center gap-2 group"
                  >
                    <ThumbsDown className={`w-5 h-5 transition-all ${
                      post.disliked ? 'fill-blue-500 text-blue-500' : 'text-gray-400 group-hover:text-blue-500'
                    }`} />
                    <span className={`text-sm ${post.disliked ? 'text-blue-500' : 'text-gray-400'}`}>
                      {post.dislikes}
                    </span>
                  </button>

                  {/* Share */}
                  <button
                    onClick={() => handleShare(post.id)}
                    className="flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-all group"
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="text-sm">{post.shares}</span>
                  </button>

                  {/* Repost */}
                  <button
                    onClick={() => handleRepost(post.id)}
                    className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-all group"
                  >
                    <Repeat className="w-5 h-5" />
                    <span className="text-sm">{post.reposts}</span>
                  </button>
                </div>

                {/* Views */}
                <div className="flex items-center gap-2 text-gray-400">
                  <Eye className="w-5 h-5" />
                  <span className="text-sm">{post.views} views</span>
                </div>
              </div>

              {/* Timestamp */}
              <p className="text-gray-500 text-xs mt-3">
                {post.createdAt.toLocaleString()}
              </p>
            </Card>
          ))
        )}
      </div>

      {/* Instagram Camera */}
      {showCamera && (
        <InstagramCamera
          onClose={() => setShowCamera(false)}
          onVideoRecorded={handleVideoRecorded}
        />
      )}
    </div>
  );
}
