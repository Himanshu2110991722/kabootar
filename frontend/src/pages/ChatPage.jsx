import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { getSocket, getRoomId } from "../lib/socket";
import { ChevronLeft, Send, Star } from "lucide-react";
import { format } from "date-fns";
import RatingModal from "../components/RatingModal";

export default function ChatPage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [partner, setPartner] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [showRating, setShowRating] = useState(false);
  const bottomRef = useRef(null);
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
    socket.emit("join_room", roomId);

    const handleMessage = (msg) => {
      setMessages(prev => {
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on("receive_message", handleMessage);
    return () => socket.off("receive_message", handleMessage);
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    const payload = text.trim();
    setText("");

    const socket = getSocket();
    if (socket.connected) {
      socket.emit("send_message", {
        senderId: user._id,
        receiverId: userId,
        text: payload,
        roomId,
      });
    } else {
      // Fallback to REST
      const res = await api.post(`/chat/${userId}`, { text: payload });
      setMessages(prev => [...prev, res.data.message]);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isMine = (msg) => msg.senderId === user?._id || msg.senderId?._id === user?._id;

  if (loading) return (
    <div className="flex flex-col h-screen">
      <div className="h-14 bg-white border-b border-stone-100 animate-pulse" />
      <div className="flex-1 p-4 space-y-3">
        {[1,2,3].map(i => <div key={i} className={`h-10 w-48 rounded-2xl bg-stone-100 animate-pulse ${i%2===0 ? "ml-auto" : ""}`} />)}
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
        <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center font-bold text-orange-600 text-sm shrink-0">
          {partner?.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-stone-900 text-sm">{partner?.name}</div>
          <div className="flex items-center gap-1">
            <Star size={10} className="text-amber-400 fill-amber-400" />
            <span className="text-xs text-stone-400">{partner?.rating?.toFixed(1)} · {partner?.phone}</span>
          </div>
        </div>
        <button onClick={() => setShowRating(true)} className="btn-ghost text-xs text-stone-500">
          Rate
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-stone-50">
        {messages.length === 0 && (
          <div className="text-center text-stone-400 text-sm py-8">
            Start the conversation! 👋
          </div>
        )}
        {messages.map((msg, i) => {
          const mine = isMine(msg);
          const showTime = i === 0 || new Date(msg.timestamp) - new Date(messages[i-1].timestamp) > 5*60*1000;
          return (
            <div key={msg._id || i}>
              {showTime && (
                <div className="text-center text-[11px] text-stone-400 my-2">
                  {format(new Date(msg.timestamp), "hh:mm a")}
                </div>
              )}
              <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`relative max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    mine
                      ? "bg-orange-500 text-white rounded-br-sm"
                      : "bg-white text-stone-900 rounded-bl-sm shadow-sm border border-stone-100"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-stone-100 px-4 py-3 flex gap-2 items-end">
        <textarea
          className="flex-1 bg-stone-50 border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-xl px-3.5 py-2.5 text-sm resize-none outline-none max-h-28 transition-all"
          placeholder="Type a message..."
          rows={1}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim()}
          className="w-10 h-10 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white flex items-center justify-center transition-all active:scale-95 shrink-0"
        >
          <Send size={16} />
        </button>
      </div>

      {showRating && (
        <RatingModal
          partner={partner}
          onClose={() => setShowRating(false)}
        />
      )}
    </div>
  );
}
