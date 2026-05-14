import { useState } from 'react';
import { Heart, MessageCircle, Share2, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function PostCard({ post: initial, onOpen }) {
  const { user } = useAuth();
  const [post,         setPost]         = useState(initial);
  const [showComments, setShowComments] = useState(false);
  const [commentText,  setCommentText]  = useState('');
  const [posting,      setPosting]      = useState(false);

  const liked = user && post.likes?.includes(user._id);

  const handleLike = async () => {
    if (!user) { toast.error('Sign in to like posts'); return; }
    try {
      const { data } = await api.patch(`/posts/${post._id}/like`);
      setPost(p => ({
        ...p,
        likes: data.liked
          ? [...(p.likes || []), user._id]
          : (p.likes || []).filter(id => id !== user._id),
      }));
    } catch {}
  };

  const handleShare = async () => {
    const text = `${post.title}\n\n${post.content.slice(0, 120)}...\n\nDelivered via Kabutar — app.kabutar.in`;
    if (navigator.share) {
      await navigator.share({ title: post.title, text, url: 'https://app.kabutar.in' }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
      toast.success('Copied to clipboard!');
    }
  };

  const handleComment = async () => {
    if (!user) { toast.error('Sign in to comment'); return; }
    if (!commentText.trim()) return;
    setPosting(true);
    try {
      const { data } = await api.post(`/posts/${post._id}/comment`, { text: commentText });
      setPost(p => ({ ...p, comments: [...(p.comments || []), data.comment] }));
      setCommentText('');
    } catch { toast.error('Failed to post comment'); }
    finally { setPosting(false); }
  };

  const statColors = ['bg-orange-50 text-orange-600', 'bg-blue-50 text-blue-600', 'bg-emerald-50 text-emerald-600'];

  return (
    <div className="bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-sm"
      style={{ animation: 'staggerIn 0.35s ease both' }}>

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm shadow-orange-200 shrink-0">
          <span className="text-lg">{post.emoji || '🕊️'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-stone-900">Kabutar</p>
          <p className="text-[10px] text-stone-400">
            {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : 'Official'}
          </p>
        </div>
        <span className="text-[10px] font-bold bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full border border-orange-100">
          ✓ Official
        </span>
      </div>

      {/* Image */}
      {post.image && (
        <button onClick={() => onOpen?.(post)} className="w-full block">
          <img src={post.image} alt={post.title}
            className="w-full object-cover"
            style={{ maxHeight: 200 }} />
        </button>
      )}

      {/* Content */}
      <div className="px-4 pb-2 pt-1">
        <h3 className="text-sm font-black text-stone-900 leading-snug mb-1.5">{post.title}</h3>
        <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">{post.content}</p>

        {/* Stats badges */}
        {post.stats && Object.values(post.stats).some(Boolean) && (
          <div className="flex gap-2 flex-wrap mt-2.5">
            {post.stats.route && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl ${statColors[0]}`}>📍 {post.stats.route}</span>
            )}
            {post.stats.time && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl ${statColors[1]}`}>⏱ {post.stats.time}</span>
            )}
            {post.stats.saved && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl ${statColors[2]}`}>💰 {post.stats.saved}</span>
            )}
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-1 mt-3 pt-2.5 border-t border-stone-50">
          <button onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all active:scale-90 ${liked ? 'bg-red-50' : 'hover:bg-stone-50'}`}>
            <Heart size={15} className={liked ? 'fill-red-500 text-red-500' : 'text-stone-400'} />
            <span className={`text-xs font-semibold ${liked ? 'text-red-500' : 'text-stone-400'}`}>
              {(post.likes?.length || 0) > 0 ? post.likes.length : 'Like'}
            </span>
          </button>

          <button onClick={() => setShowComments(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-stone-50 transition-all active:scale-90">
            <MessageCircle size={15} className="text-stone-400" />
            <span className="text-xs font-semibold text-stone-400">
              {(post.comments?.length || 0) > 0 ? post.comments.length : 'Comment'}
            </span>
            {showComments
              ? <ChevronUp size={11} className="text-stone-300" />
              : <ChevronDown size={11} className="text-stone-300" />}
          </button>

          <button onClick={handleShare}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-stone-50 transition-all active:scale-90">
            <Share2 size={15} className="text-stone-400" />
            <span className="text-xs font-semibold text-stone-400">Share</span>
          </button>
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-stone-50 px-4 pb-4 pt-3 space-y-3 animate-fade-in">
          {/* Existing comments */}
          {(post.comments || []).length > 0 ? (
            <div className="space-y-2.5 max-h-48 overflow-y-auto">
              {post.comments.map((c, i) => (
                <div key={c._id || i} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    {c.avatar
                      ? <img src={c.avatar} className="w-full h-full object-cover rounded-full" />
                      : <span className="text-orange-600 text-[10px] font-black">{c.name?.[0]?.toUpperCase()}</span>}
                  </div>
                  <div className="flex-1 bg-stone-50 rounded-xl px-3 py-2">
                    <p className="text-[10px] font-bold text-stone-700">{c.name}</p>
                    <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-400 text-center py-1">No comments yet — be the first!</p>
          )}

          {/* Add comment */}
          {user ? (
            <div className="flex gap-2 items-center">
              <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0 overflow-hidden">
                {user.profileImage
                  ? <img src={user.profileImage} className="w-full h-full object-cover" />
                  : <span className="text-orange-600 text-[10px] font-black">{user.name?.[0]?.toUpperCase()}</span>}
              </div>
              <div className="flex-1 flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 focus-within:border-orange-300 transition-all">
                <input
                  className="flex-1 text-xs bg-transparent outline-none text-stone-800 placeholder:text-stone-400"
                  placeholder="Write a comment…"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleComment()}
                  maxLength={300}
                />
                <button onClick={handleComment} disabled={!commentText.trim() || posting}
                  className="text-orange-500 disabled:opacity-40 active:scale-90 transition-all shrink-0">
                  <Send size={14} />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-stone-400 text-center">
              <span className="text-orange-500 font-semibold cursor-pointer">Sign in</span> to comment
            </p>
          )}
        </div>
      )}
    </div>
  );
}
