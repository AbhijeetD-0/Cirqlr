import React, { useState, useEffect, useRef } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { BookingRecord } from '../../types/marketplace';
import { 
  X, 
  Send, 
  ShieldCheck, 
  MapPin, 
  User, 
  AlertCircle 
} from 'lucide-react';

export interface ChatModalProps {
  booking?: BookingRecord | null;
  onClose?: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({ booking: propBooking, onClose }) => {
  const { 
    activeChatBookingId, 
    setActiveChatBookingId, 
    bookings, 
    getMessagesForBooking, 
    sendChatMessage, 
    usersAndCompanions,
    currentUser 
  } = useMarketplace();

  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    setActiveChatBookingId(null);
  };

  // Resolve target booking: prefer directly passed prop, fallback to context state
  const targetBooking = propBooking || (activeChatBookingId ? (bookings || []).find((b) => b?.id === activeChatBookingId) : null);

  // Fetch messages safely
  const rawMessages = targetBooking?.id && typeof getMessagesForBooking === 'function'
    ? getMessagesForBooking(targetBooking.id)
    : [];
  const messages = Array.isArray(rawMessages) ? rawMessages : [];

  useEffect(() => {
    try {
      if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } catch {
      // Ignore scroll errors
    }
  }, [messages.length]);

  // 3. REMOVE OVER-STRICT BLOCKS:
  // Only show the error warning if the booking object is entirely null or undefined!
  if (!targetBooking) {
    // If modal was neither given a prop nor an active ID, return null
    if (!propBooking && !activeChatBookingId) {
      return null;
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 animate-fadeIn">
        <div className="bg-white rounded-3xl max-w-sm w-full m-2 sm:m-4 p-6 text-center space-y-3 shadow-2xl border border-slate-200">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Chat Session Warning</h3>
          <p className="text-xs text-slate-500">
            Unable to display this outing chat session. Booking record could not be found.
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="mt-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // 2. FIX PARTICIPANT LOGIC:
  // - If currentUser is Companion, find Booker in users state using booker info from booking object
  // - If currentUser is Booker, find Companion using companionToken from booking object
  const isCompanion = Boolean(
    currentUser && (
      currentUser.userToken === targetBooking?.companionToken || 
      currentUser.userToken === targetBooking?.companionId
    )
  );

  let otherParticipant: {
    fullName: string;
    userToken: string;
    avatarUrl?: string;
  };

  if (isCompanion) {
    // Current user is Companion -> find Booker
    const bookerToken = targetBooking?.bookerToken || targetBooking?.bookerId || '';
    const bookerName = targetBooking?.bookerName || 'Booker';

    const foundBooker = (usersAndCompanions || []).find((u) => 
      (bookerToken && u?.userToken === bookerToken) ||
      (bookerName && u?.fullName?.toLowerCase() === bookerName.toLowerCase())
    );

    otherParticipant = {
      fullName: foundBooker?.fullName || bookerName,
      userToken: foundBooker?.userToken || bookerToken || 'USR-BOOKER',
      avatarUrl: foundBooker?.avatarUrl || '',
    };
  } else {
    // Current user is Booker -> find Companion
    const companionToken = targetBooking?.companionToken || targetBooking?.companionId || '';
    const companionName = targetBooking?.companionName || 'Companion';

    const foundCompanion = (usersAndCompanions || []).find((u) => 
      (companionToken && u?.userToken === companionToken) ||
      (companionName && u?.fullName?.toLowerCase() === companionName.toLowerCase())
    );

    otherParticipant = {
      fullName: foundCompanion?.fullName || companionName,
      userToken: foundCompanion?.userToken || companionToken || 'USR-COMPANION',
      avatarUrl: foundCompanion?.avatarUrl || '',
    };
  }


  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText || !inputText.trim()) return;
    if (!targetBooking?.id) return;
    sendChatMessage(targetBooking.id, inputText.trim());
    setInputText('');
  };

  const handleQuickShareLandmark = () => {
    if (!targetBooking?.id) return;
    sendChatMessage(
      targetBooking.id,
      `📍 Public Landmark Spot: I am inside ${targetBooking?.venueName || 'the venue'}, waiting by the main lobby / central information desk.`
    );
  };

  const handleQuickShareArrived = () => {
    if (!targetBooking?.id) return;
    sendChatMessage(
      targetBooking.id,
      `👋 I have arrived at ${targetBooking?.venueName || 'the venue'}! Waiting inside near the public entrance.`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-full sm:max-w-xl md:max-w-3xl h-[620px] max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col m-2 sm:m-4 md:m-6">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Safe Avatar */}
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
              {otherParticipant?.avatarUrl && 
               typeof otherParticipant?.avatarUrl === 'string' && 
               otherParticipant.avatarUrl.trim() !== '' ? (
                <img
                  src={otherParticipant.avatarUrl}
                  alt={otherParticipant?.fullName || 'Participant'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-300 font-bold text-xs uppercase">
                  {typeof otherParticipant?.fullName === 'string' && otherParticipant.fullName.trim() !== '' ? (
                    <span>{otherParticipant.fullName.charAt(0).toUpperCase()}</span>
                  ) : (
                    <User className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white truncate max-w-[200px] sm:max-w-[280px]">
                  Encrypted Outing Chat with {otherParticipant?.fullName || 'Participant'}
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30 whitespace-nowrap">
                  {targetBooking?.status || 'Confirmed Outing'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Booking Ref: {targetBooking?.bookingToken || 'N/A'} • {targetBooking?.venueCategory || 'Public Venue'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* E2E Security Banner */}
        <div className="bg-indigo-950/90 text-indigo-200 px-4 py-2 border-b border-indigo-900 text-[11px] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>256-bit Simulated E2E Encrypted • Phone numbers remain permanently protected</span>
          </div>
          <span className="text-slate-400 hidden sm:inline text-[10px]">
            Public Venue Coordination Only
          </span>
        </div>

        {/* Outing Context Reminder Strip */}
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="font-semibold text-slate-800 truncate">{targetBooking?.venueName || 'Public Venue'}</span>
            {targetBooking?.venueAddress ? (
              <span className="text-slate-400 truncate">({targetBooking.venueAddress})</span>
            ) : null}
          </div>
          <span className="text-[11px] text-slate-500 font-medium shrink-0 ml-2">
            {targetBooking?.outingDate || ''} • {targetBooking?.outingTime || ''}
          </span>
        </div>

        {/* Message Log */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-100/60">
          {(messages || []).map((msg, index) => {
            if (!msg) return null;

            const msgKey = msg?.id || `msg-${index}`;
            const isSystem = Boolean(msg?.isSystemNotice);
            const isMe = Boolean(currentUser?.userToken && msg?.senderToken === currentUser?.userToken);

            let formattedTime = '';
            try {
              if (msg?.timestamp) {
                const dateObj = new Date(msg.timestamp);
                if (!isNaN(dateObj.getTime())) {
                  formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
              }
            } catch {
              formattedTime = '';
            }

            if (isSystem) {
              return (
                <div
                  key={msgKey}
                  className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 leading-relaxed shadow-2xs"
                >
                  <div className="font-bold text-[11px] text-emerald-800 flex items-center gap-1 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{msg?.senderName || 'Security Protocol'}</span>
                  </div>
                  <p className="text-xs">{msg?.text || ''}</p>
                </div>
              );
            }

            return (
              <div
                key={msgKey}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-semibold text-slate-500">
                    {isMe ? 'You' : (msg?.senderName || otherParticipant?.fullName || 'Participant')}
                  </span>
                  {formattedTime ? (
                    <span className="text-[9px] text-slate-400">
                      {formattedTime}
                    </span>
                  ) : null}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                  }`}
                >
                  {msg?.text || ''}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Venue Actions */}
        <div className="bg-white border-t border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Quick:
          </span>
          <button
            type="button"
            onClick={handleQuickShareLandmark}
            className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            📍 Share Public Landmark
          </button>
          <button
            type="button"
            onClick={handleQuickShareArrived}
            className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            👋 I have arrived at venue
          </button>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
          <input
            type="text"
            placeholder="Type your public venue coordination message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
