import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { getSocket, getRoomId } from '../lib/socket';
import { ChevronLeft, Send, Star, IndianRupee, Check, X, ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import RatingModal from '../components/RatingModal';
import KabutarLoader from '../components/KabutarLoader';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [partner, setPartner] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showRating, setShowRating] = useState(false);
  const [showOfferPanel, setShowOfferPanel] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [sendingOffer, setSendingOffer] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const bottomRef = useRef(null);
  const imageInputRef = useRef(null);
  const roomId = user?._id && userId ? getRoomId(user._id, userId) : null;

  useEffect(() => {
    api.get(`/chat/${userId}`)
      .then(r => {
        setMessages(r.data.messages);
        setPartner(r.data.partner);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (!roomId) return;
    const socket = getSocket();
    socket.emit('join_room', roomId);
    const handleMessage = (msg) => {
      setMessages(prev => prev.find(m => m._id === msg._id) ? prev : [...prev, msg]);
    };
    socket.on('receive_message', handleMessage);
    return () => socket.off('receive_message', handleMessage);
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── send generic message ──────────────────────────────────────────────────
  const sendMessage = async (payload = text.trim(), msgType = 'text', amount = null, imageUrl = null) => {
    if (msgType === 'text' && !payload) return;
    if (msgType === 'text') setText('');

    const socket = getSocket();
    if (socket.connected) {
      socket.emit('send_message', { senderId: user._id, receiverId: userId, text: payload, type: msgType, amount, imageUrl, roomId });
    } else {
      const res = await api.post(`/chat/${userId}`, { text: payload, type: msgType, amount, imageUrl });
      setMessages(prev => [...prev, res.data.message]);
    }
  };

  // ── offer ─────────────────────────────────────────────────────────────────
  const sendOffer = async () => {
    const amt = parseFloat(offerAmount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    setSendingOffer(true);
    await sendMessage(`💰 Offer: ₹${amt}`, 'offer', amt);
    setShowOfferPanel(false);
    setOfferAmount('');
    setSendingOffer(false);
  };

  // ── accept offer ──────────────────────────────────────────────────────────
  // Strategy: find an active parcel between the two users in either direction,
  // then accept it (or update offeredPrice if already accepted).
  const acceptOffer = async (amount) => {
    try {
      // 1. Check current user's parcels where partner is sender or traveler
      const myRes = await api.get('/parcels/my');
      let parcel = myRes.data.parcels.find(p => {
        const senderId  = String(p.userId?._id  || p.userId  || '');
        const travelId  = String(p.travelerId?._id || p.travelerId || '');
        const partnerId = String(userId);
        return (senderId === partnerId || travelId === partnerId) &&
               !['delivered', 'cancelled'].includes(p.status);
      });

      // 2. Not found → look for open parcels posted BY the partner (traveler accepting sender's post)
      if (!parcel) {
        const partnerRes = await api.get(`/parcels/by-sender/${userId}`);
        parcel = partnerRes.data.parcels?.[0];
      }

      if (!parcel) {
        toast.error('No active parcel request found. The sender should post a parcel first.');
        return;
      }

      // 3a. Parcel is open → formally accept it at this price
      if (parcel.status === 'open') {
        await api.post(`/parcels/${parcel._id}/accept`, { offeredPrice: amount });
        toast.success(`Accepted! ₹${amount} locked in 🤝`);
        return;
      }

      // 3b. Parcel already accepted → just update the price
      await api.patch(`/parcels/${parcel._id}`, { offeredPrice: amount });
      toast.success(`₹${amount} agreed — price updated!`);
    } catch (err) {
      const msg = err.response?.data?.message;
      toast.error(msg || 'Could not update parcel');
    }
  };

  // ── image upload ──────────────────────────────────────────────────────────
  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast.error('Image must be under 4 MB'); return; }
    setSendingImage(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        await sendMessage('[📷 Image]', 'image', null, ev.target.result);
      } catch {
        toast.error('Failed to send image');
      } finally {
        setSendingImage(false);
        e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const isMine = (msg) => msg.senderId === user?._id || msg.senderId?._id === user?._id;

  if (loading) return (
    <div className="flex flex-col h-screen">
      <div className="h-14 bg-white border-b border-stone-100 animate-pulse" />
      <div className="flex-1 flex items-center justify-center">
        <KabutarLoader text="Opening chat…" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="btn-ghost p-1.5 -ml-1.5">
          <ChevronLeft size={20} />
        </button>
        <div className="w-9 h-9 rounded-full bg-orange-50 overflow-hidden flex items-center justify-center font-bold text-orange-600 text-sm shrink-0">
          {partner?.profileImage
            ? <img src={partner.profileImage} alt={partner.name} className="w-full h-full object-cover" />
            : partner?.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-stone-900 text-sm">{partner?.name}</div>
          <div className="flex items-center gap-1">
            <Star size={10} className="text-amber-400 fill-amber-400" />
            <span className="text-xs text-stone-400">{partner?.rating?.toFixed(1)}</span>
            {partner?.maskedPhone && (
              <span className="text-xs text-stone-300 ml-1">· {partner.maskedPhone}</span>
            )}
          </div>
        </div>
        <button onClick={() => setShowRating(true)} className="btn-ghost text-xs text-stone-500">Rate</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-stone-50">
        {messages.length === 0 && (
          <div className="text-center text-stone-400 text-sm py-8">Start the conversation! 👋</div>
        )}
        {messages.map((msg, i) => {
          const mine = isMine(msg);
          const showTime = i === 0 || new Date(msg.timestamp) - new Date(messages[i - 1].timestamp) > 5 * 60 * 1000;

          return (
            <div key={msg._id || i}>
              {showTime && (
                <div className="text-center text-[11px] text-stone-400 my-2">
                  {format(new Date(msg.timestamp), 'hh:mm a')}
                </div>
              )}

              {/* OFFER bubble */}
              {msg.type === 'offer' && (
                <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] rounded-2xl border-2 border-orange-300 bg-orange-50 px-4 py-3 space-y-2 ${mine ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
                    <div className="flex items-center gap-1.5 font-bold text-orange-600 text-sm">
                      <IndianRupee size={14} />
                      Offer: ₹{msg.amount}
                    </div>
                    {!mine && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => acceptOffer(msg.amount)}
                          className="flex-1 flex items-center justify-center gap-1 bg-emerald-500 text-white text-xs font-semibold py-1.5 rounded-lg active:scale-95 transition-all"
                        >
                          <Check size={12} /> Accept
                        </button>
                        <button
                          onClick={() => { setOfferAmount(String(msg.amount)); setShowOfferPanel(true); }}
                          className="flex-1 flex items-center justify-center gap-1 bg-stone-100 text-stone-600 text-xs font-semibold py-1.5 rounded-lg active:scale-95 transition-all"
                        >
                          Counter
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* IMAGE bubble */}
              {msg.type === 'image' && (
                <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <button
                    onClick={() => setLightbox(msg.imageUrl)}
                    className={`max-w-[60%] rounded-2xl overflow-hidden border-2 ${mine ? 'border-orange-200 rounded-br-sm' : 'border-stone-100 rounded-bl-sm'} shadow-sm active:scale-95 transition-all`}
                  >
                    <img
                      src={msg.imageUrl}
                      alt="shared"
                      className="w-full max-h-56 object-cover"
                      loading="lazy"
                    />
                  </button>
                </div>
              )}

              {/* TEXT bubble */}
              {msg.type === 'text' && (
                <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`relative max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    mine
                      ? 'bg-orange-500 text-white rounded-br-sm'
                      : 'bg-white text-stone-900 rounded-bl-sm shadow-sm border border-stone-100'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Offer panel */}
      {showOfferPanel && (
        <div className="bg-white border-t border-stone-100 px-4 py-3 flex gap-2 items-center animate-slide-up">
          <div className="flex items-center gap-1.5 flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
            <span className="text-stone-400 text-sm font-semibold">₹</span>
            <input
              className="flex-1 bg-transparent outline-none text-sm font-semibold text-stone-900"
              placeholder="Amount"
              type="number"
              min="1"
              value={offerAmount}
              onChange={e => setOfferAmount(e.target.value)}
              autoFocus
            />
          </div>
          <button onClick={sendOffer} disabled={sendingOffer} className="btn-primary py-2 px-4 text-sm">
            {sendingOffer ? '…' : 'Send Offer'}
          </button>
          <button onClick={() => { setShowOfferPanel(false); setOfferAmount(''); }} className="btn-ghost p-2">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Input bar */}
      <div className="bg-white border-t border-stone-100 px-4 py-3 flex gap-2 items-end">
        {/* Offer button */}
        <button
          onClick={() => setShowOfferPanel(v => !v)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 border ${
            showOfferPanel ? 'bg-orange-500 text-white border-orange-500' : 'bg-stone-50 text-stone-500 border-stone-200 hover:border-orange-300'
          }`}
          title="Make an offer"
        >
          <IndianRupee size={16} />
        </button>

        {/* Image button */}
        <button
          onClick={() => imageInputRef.current?.click()}
          disabled={sendingImage}
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border bg-stone-50 text-stone-500 border-stone-200 hover:border-blue-300 hover:text-blue-500 transition-all disabled:opacity-40"
          title="Send image"
        >
          {sendingImage
            ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            : <ImageIcon size={16} />}
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImagePick}
        />

        {/* Text input */}
        <textarea
          className="flex-1 bg-stone-50 border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-xl px-3.5 py-2.5 text-sm resize-none outline-none max-h-28 transition-all"
          placeholder="Type a message..."
          rows={1}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
        />

        {/* Send button */}
        <button
          onClick={() => sendMessage()}
          disabled={!text.trim()}
          className="w-10 h-10 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white flex items-center justify-center transition-all active:scale-95 shrink-0"
        >
          <Send size={16} />
        </button>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20">
            <X size={20} />
          </button>
          <img
            src={lightbox}
            alt="full size"
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {showRating && <RatingModal partner={partner} onClose={() => setShowRating(false)} />}
    </div>
  );
}
