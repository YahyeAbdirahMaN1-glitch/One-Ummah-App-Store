import { useState, useEffect, useRef } from 'react';
import { Video, Heart, ThumbsDown, Share2, Repeat, Eye, MessageCircle, Send, Trash2, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import InstagramCamera from '../components/InstagramCamera';
import ProfileQuickSettings from '../components/ProfileQuickSettings';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { CapacitorHttp } from '@capacitor/core';
import { API_URL } from '../config';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  content: string;
  createdAt: Date;
}

interface Post {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  userIsOnline?: boolean;
  content: string;
  videoUrl?: string;
  videoType?: 'littles' | 'length';
  likes: number;
  dislikes: number;
  shares: number;
  reposts: number;
  views: number;
  comments: Comment[];
  liked: boolean;
  disliked: boolean;
  showComments?: boolean;
  createdAt: Date;
}

export default function HomePage() {
  const { user } = useAuth();
  const [postContent, setPostContent] = useState('');
  const [recordedVideo, setRecordedVideo] = useState<{ blob: Blob; type: 'littles' | 'length' } | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [viewedPosts, setViewedPosts] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const postRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [showProfileSettings, setShowProfileSettings] = useState<{ userId: string; userName: string; isOnline: boolean } | null>(null);

  // Load all posts from database on component mount
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      console.log('[iOS DEBUG] Starting to load posts...');
      console.log('[iOS DEBUG] API_URL:', API_URL);
      
      setLoadingPosts(true);
      setPostsError(null);

      const response = await CapacitorHttp.post({
        url: `${API_URL}/getPosts`,
        headers: { 'Content-Type': 'application/json' },
        data: { limit: 50, offset: 0 },
      });

      console.log('[iOS DEBUG] Response status:', response.status);
      console.log('[iOS DEBUG] Response data:', JSON.stringify(response.data).substring(0, 200));

      if (response.status === 200 && response.data && response.data.posts) {
        console.log('[iOS DEBUG] Found', response.data.posts.length, 'posts');
        
        const formattedPosts: Post[] = response.data.posts.map((post: any) => ({
          id: post.id,
          userId: post.userId,
          userName: post.user?.name || 'Anonymous',
          userImage: post.user?.profilePicture || undefined,
          userIsOnline: post.user?.isOnline || false,
          content: post.content,
          videoUrl: post.videoUrls || undefined,
          videoType: post.videoType as 'littles' | 'length' | undefined,
          likes: post.likesCount || 0,
          dislikes: post.dislikesCount || 0,
          shares: post.sharesCount || 0,
          reposts: post.repostsCount || 0,
          views: post.viewsCount || 0,
          comments: post.comments?.map((c: any) => ({
            id: c.id,
            userId: c.userId,
            userName: c.user?.name || 'Anonymous',
            userImage: c.user?.profilePicture || undefined,
            content: c.content,
            createdAt: new Date(c.createdAt),
          })) || [],
          liked: false,
          disliked: false,
          showComments: false,
          createdAt: new Date(post.createdAt),
        }));

        setPosts(formattedPosts);
        console.log('[iOS DEBUG] Posts loaded successfully:', formattedPosts.length);
      } else {
        console.log('[iOS DEBUG] No posts found - empty feed');
        setPosts([]);
      }
      
      setLoadingPosts(false);
    } catch (error: any) {
      console.error('[iOS DEBUG] Failed to load posts:', error);
      console.error('[iOS DEBUG] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      setPostsError(`Failed to load posts: ${error.message}`);
      setLoadingPosts(false);
      setPosts([]);
    }
  };

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

    if (!user) {
      toast.error('Please sign in to create a post');
      return;
    }

    try {
      toast.loading('Creating post...');

      // Convert video to base64 if present
      let videoBase64: string | undefined;
      if (recordedVideo) {
        const reader = new FileReader();
        videoBase64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(recordedVideo.blob);
        });
      }

      // Save to database
      console.log('Creating post with data:', {
        userId: user.id,
        content: postContent,
        hasVideo: !!videoBase64,
        videoType: recordedVideo?.type
      });

      const response = await CapacitorHttp.post({
        url: `${API_URL}/createPost`,
        headers: { 'Content-Type': 'application/json' },
        data: {
          userId: user.id,
          content: postContent,
          videoUrls: videoBase64 || null,
          videoType: recordedVideo?.type || null,
        },
      });

      console.log('CreatePost API Response:', {
        status: response.status,
        hasData: !!response.data,
        hasPost: !!(response.data && response.data.post)
      });

      if (response.status !== 200) {
        toast.dismiss();
        toast.error(`Server error: ${response.status}`);
        console.error('API returned non-200 status:', response);
        return;
      }

      if (response.data && response.data.post) {
        const dbPost = response.data.post;
        
        // Add to local state immediately
        const newPost: Post = {
          id: dbPost.id,
          userId: user.id,
          userName: user.name || 'Anonymous',
          userImage: user.profilePicture || undefined,
          content: postContent,
          videoUrl: videoBase64 || undefined,
          videoType: recordedVideo?.type,
          likes: 0,
          dislikes: 0,
          shares: 0,
          reposts: 0,
          views: 0,
          comments: [],
          liked: false,
          disliked: false,
          showComments: false,
          createdAt: new Date(),
        };

        setPosts([newPost, ...posts]);
        toast.dismiss();
        toast.success('Post created successfully!');
        setPostContent('');
        setRecordedVideo(null);
      } else {
        toast.dismiss();
        toast.error('Server returned invalid response');
        console.error('Invalid API response:', response.data);
      }
    } catch (error: any) {
      toast.dismiss();
      const errorMessage = error?.message || 'Unknown error';
      toast.error(`Failed to create post: ${errorMessage}`);
      console.error('Create post error:', error);
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

  const toggleComments = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId ? { ...post, showComments: !post.showComments } : post
    ));
  };

  const handleAddComment = (postId: string) => {
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) {
      toast.error('Please enter a comment');
      return;
    }

    if (!user) {
      toast.error('Please login to comment');
      return;
    }

    const newComment: Comment = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name || 'Anonymous',
      userImage: user.profilePicture || undefined,
      content: commentText,
      createdAt: new Date(),
    };

    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, comments: [...post.comments, newComment], showComments: true }
        : post
    ));

    // Clear comment input
    setCommentInputs({ ...commentInputs, [postId]: '' });
    toast.success('Comment added!');
  };

  const updateCommentInput = (postId: string, value: string) => {
    setCommentInputs({ ...commentInputs, [postId]: value });
  };

  const handleDeletePost = (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      setPosts(posts.filter(post => post.id !== postId));
      toast.success('Post deleted');
      // In real app, call API to delete from database
      // deletePost(postId, user?.id);
    }
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
        {loadingPosts ? (
          <Card className="bg-gradient-to-br from-amber-950/30 to-black border-amber-900/30 p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-400"></div>
              <p className="text-amber-400 text-lg font-semibold">Loading posts...</p>
              <p className="text-gray-400 text-sm">Connecting to One Ummah</p>
            </div>
          </Card>
        ) : postsError ? (
          <Card className="bg-gradient-to-br from-amber-950/30 to-black border-amber-900/30 p-6">
            <div className="text-center">
              <p className="text-amber-400 mb-2">{postsError}</p>
              <Button 
                onClick={loadPosts}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white mt-4"
              >
                Retry
              </Button>
            </div>
          </Card>
        ) : posts.length === 0 ? (
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
              className="bg-gradient-to-br from-amber-950/30 to-black border-amber-900/30 p-6 relative"
            >
              {/* Delete Button */}
              <button
                onClick={() => handleDeletePost(post.id)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-red-500/80 text-gray-400 hover:text-white transition-all group"
                aria-label="Delete post"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* User Profile Section */}
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-amber-900/30">
                <div className="relative">
                  {post.userImage ? (
                    <img
                      src={post.userImage}
                      alt={post.userName}
                      className="w-12 h-12 rounded-full border-2 border-amber-500 object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center border-2 border-amber-500">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}
                  {/* Online/Offline Indicator */}
                  <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-black ${
                    post.userIsOnline ? 'bg-green-400' : 'bg-red-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        // Only allow editing own profile
                        if (user && post.userId === user.id) {
                          setShowProfileSettings({
                            userId: post.userId,
                            userName: post.userName,
                            isOnline: post.userIsOnline || false
                          });
                        }
                      }}
                      className={`text-white font-semibold ${user && post.userId === user.id ? 'hover:text-amber-400 cursor-pointer transition-colors' : ''}`}
                    >
                      {post.userName}
                    </button>
                    <span className={`text-xs font-semibold ${post.userIsOnline ? 'text-green-400' : 'text-red-400'}`}>
                      {post.userIsOnline ? '● Online' : '● Offline'}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    {post.createdAt.toLocaleDateString()} at {post.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

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

                  {/* Comments */}
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-all group"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">{post.comments.length}</span>
                  </button>
                </div>

                {/* Views */}
                <div className="flex items-center gap-2 text-gray-400">
                  <Eye className="w-5 h-5" />
                  <span className="text-sm">{post.views} views</span>
                </div>
              </div>

              {/* Comments Section */}
              {post.showComments && (
                <div className="mt-4 border-t border-amber-900/30 pt-4 space-y-4">
                  {/* Comment Input */}
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentInputs[post.id] || ''}
                      onChange={(e) => updateCommentInput(post.id, e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                      className="bg-black/30 border-amber-900/30 text-white placeholder:text-gray-500"
                    />
                    <Button
                      onClick={() => handleAddComment(post.id)}
                      size="sm"
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Comments List */}
                  {post.comments.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {post.comments.map(comment => (
                        <div key={comment.id} className="flex gap-3 bg-black/20 rounded-lg p-3">
                          {/* User Avatar */}
                          <div className="flex-shrink-0">
                            {comment.userImage ? (
                              <img
                                src={comment.userImage}
                                alt={comment.userName}
                                className="w-8 h-8 rounded-full border-2 border-amber-500"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-sm">
                                {comment.userName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* Comment Content */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-amber-400 font-semibold text-sm">
                                {comment.userName}
                              </span>
                              <span className="text-gray-500 text-xs">
                                {comment.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-white text-sm">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No comments yet. Be the first to comment!
                    </p>
                  )}
                </div>
              )}

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

      {/* Profile Quick Settings Modal */}
      {showProfileSettings && (
        <ProfileQuickSettings
          userId={showProfileSettings.userId}
          userName={showProfileSettings.userName}
          isOnline={showProfileSettings.isOnline}
          onClose={() => setShowProfileSettings(null)}
        />
      )}
    </div>
  );
}
