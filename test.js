// components/market/CommentSection.js BEFORE
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ThumbsUp, Reply, Trash2, Send, ChevronDown, MessageCircle, Repeat2, Bookmark, Share2, ArrowLeft } from 'lucide-react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const CHAR_LIMIT = 280;
const MIN_WORDS = 100;
const THREAD_SUGGEST_AT = 220;

const countWords = (str) => str.trim().split(/\s+/).filter(Boolean).length;

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(date).toLocaleDateString('en-RW', { month: 'short', day: 'numeric' });
};

const authHeaders = () => {
  const token = localStorage.getItem('userAuthToken');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
};

const isLoggedIn      = () => !!localStorage.getItem('userAuthToken');
const currentUserId   = () => localStorage.getItem('userId');
const currentUserName = () => localStorage.getItem('userName') || 'You';

// ── Auto-grow textarea ────────────────────────────────────────────
const AutoTextarea = ({ value, onChange, placeholder, minRows = 3, disabled = false, autoFocus = false, style = {} }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, [value]);
  useEffect(() => { if (autoFocus && ref.current) ref.current.focus(); }, [autoFocus]);
  return (
    <textarea
      ref={ref} value={value} onChange={onChange} placeholder={placeholder}
      disabled={disabled} rows={minRows}
      style={{
        width: '100%', background: 'transparent', border: 'none', outline: 'none',
        resize: 'none', overflow: 'hidden', padding: 0,
        fontFamily: "'Libre Baskerville', serif", fontSize: '0.92rem',
        color: '#111', lineHeight: 1.78, boxSizing: 'border-box', display: 'block',
        ...style,
      }}
    />
  );
};

// ── Avatar ────────────────────────────────────────────────────────
const Avatar = ({ name, size = 38 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    background: '#fff3ec', border: '1.5px solid rgba(255,102,0,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Oswald', sans-serif", fontWeight: 700,
    fontSize: size > 32 ? '0.8rem' : '0.62rem', color: '#ff6600', userSelect: 'none',
  }}>
    {name?.[0]?.toUpperCase() || '?'}
  </div>
);

const Connector = () => (
  <div style={{
    width: 2, background: '#e8e8e8', borderRadius: 1, margin: '4px auto 0',
    flexShrink: 0, minHeight: 24, alignSelf: 'stretch',
  }} />
);

const ActionBtn = ({ icon, label, onClick, color = '#aaa', hoverColor, hoverBg, active }) => {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseOver={() => setHov(true)} onMouseOut={() => setHov(false)}
      style={{
        background: hov && hoverBg ? hoverBg : 'none', border: 'none',
        cursor: onClick ? 'pointer' : 'default',
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '5px 10px', borderRadius: 20,
        color: active ? (hoverColor || color) : (hov ? (hoverColor || color) : color),
        fontFamily: "'Oswald', sans-serif", fontSize: '0.68rem',
        letterSpacing: '0.06em', transition: 'all 0.12s',
      }}
    >
      {icon}
      {label != null && label > 0 && <span>{label}</span>}
    </button>
  );
};

const WordCountHint = ({ text, minWords }) => {
  const words = countWords(text);
  const remaining = minWords - words;
  if (remaining <= 0) return null;
  return (
    <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.65rem', letterSpacing: '0.08em', color: '#ccc' }}>
      {remaining} more word{remaining !== 1 ? 's' : ''} needed
    </span>
  );
};

// ── Compose Box ───────────────────────────────────────────────────
const ComposeBox = ({ placeholder, onSubmit, replyTo = null, autoFocus = false, onCancel = null, isReply = false }) => {
  const [parts, setParts]           = useState(['']);
  const [submitting, setSubmitting] = useState(false);
  const [threadMode, setThreadMode] = useState(false);

  const mainText      = parts[0];
  const charsLeft     = CHAR_LIMIT - mainText.length;
  const isOver        = charsLeft < 0;
  const nearLimit     = charsLeft <= 20 && !isOver;
  const wordCount     = countWords(mainText);
  const hasEnough     = wordCount >= MIN_WORDS;
  const canPost       = hasEnough && !isOver && !submitting &&
                        (threadMode ? parts.every(p => countWords(p) >= MIN_WORDS) : true);
  const suggestThread = mainText.length >= THREAD_SUGGEST_AT && !threadMode && !isReply;

  const updatePart = (idx, val) => setParts(prev => prev.map((p, i) => i === idx ? val : p));
  const addPart    = () => { setThreadMode(true); setParts(prev => [...prev, '']); };
  const removePart = (idx) => {
    setParts(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length <= 1) setThreadMode(false);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!canPost) return;
    setSubmitting(true);
    const fullText = threadMode ? parts.filter(p => p.trim()).join('\n\n──\n\n') : mainText;
    await onSubmit(fullText);
    setParts(['']);
    setThreadMode(false);
    setSubmitting(false);
  };

  return (
    <div style={{ borderBottom: '1px solid #f0f0f0', background: '#fff' }}>
      {replyTo && (
        <div style={{ padding: '10px 16px 0 66px' }}>
          <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.63rem', letterSpacing: '0.1em', color: '#bbb' }}>
            Replying to <span style={{ color: '#ff6600' }}>@{replyTo}</span>
          </span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 38 }}>
          <Avatar name={currentUserName()} size={38} />
          {threadMode && <Connector />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <AutoTextarea
            value={mainText} onChange={e => updatePart(0, e.target.value)}
            placeholder={placeholder} minRows={isReply ? 4 : 3} autoFocus={autoFocus}
          />
          {suggestThread && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              background: '#fff8f3', border: '1px solid rgba(255,102,0,0.18)',
              borderRadius: 3, padding: '8px 12px', marginTop: 8,
            }}>
              <span style={{ fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic', fontSize: '0.78rem', color: '#999' }}>
                Getting detailed? Add a thread so your full analysis gets the space it deserves.
              </span>
              <button onClick={addPart} style={{
                background: '#ff6600', border: 'none', borderRadius: 3, padding: '5px 12px',
                cursor: 'pointer', fontFamily: "'Oswald', sans-serif", fontSize: '0.65rem',
                letterSpacing: '0.12em', color: '#fff', whiteSpace: 'nowrap',
              }}>+ THREAD</button>
            </div>
          )}
        </div>
      </div>

      {threadMode && parts.slice(1).map((part, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 12, padding: '0 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 38 }}>
            <Avatar name={currentUserName()} size={38} />
            {idx < parts.length - 2 && <Connector />}
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingTop: 10 }}>
            <AutoTextarea
              value={part} onChange={e => updatePart(idx + 1, e.target.value)}
              placeholder={`Continue your thread... (min ${MIN_WORDS} words)`}
              minRows={3} autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <WordCountHint text={part} minWords={MIN_WORDS} />
              <button onClick={() => removePart(idx + 1)} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: '#ccc',
                fontSize: '0.65rem', fontFamily: "'Oswald', sans-serif", letterSpacing: '0.1em',
              }}
                onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                onMouseOut={e => e.currentTarget.style.color = '#ccc'}
              >REMOVE</button>
            </div>
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <WordCountHint text={mainText} minWords={MIN_WORDS} />
          {mainText.trim() && !suggestThread && !isReply && (
            <button onClick={addPart} style={{
              background: 'none', border: '1px solid #e8e8e8', borderRadius: 2,
              padding: '3px 9px', cursor: 'pointer', color: '#ff6600',
              fontFamily: "'Oswald', sans-serif", fontSize: '0.6rem', letterSpacing: '0.12em',
            }}
              onMouseOver={e => e.currentTarget.style.background = '#fff3ec'}
              onMouseOut={e => e.currentTarget.style.background = 'none'}
            >+ THREAD</button>
          )}
          {onCancel && (
            <button onClick={onCancel} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Oswald', sans-serif", fontSize: '0.65rem',
              letterSpacing: '0.1em', color: '#bbb',
            }}
              onMouseOver={e => e.currentTarget.style.color = '#666'}
              onMouseOut={e => e.currentTarget.style.color = '#bbb'}
            >CANCEL</button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {mainText.length > 0 && (
            <span style={{
              fontFamily: "'Oswald', sans-serif", fontSize: '0.68rem',
              color: isOver ? '#ef4444' : nearLimit ? '#f59e0b' : '#ccc',
            }}>{charsLeft}</span>
          )}
          <button onClick={handleSubmit} disabled={!canPost} style={{
            background: canPost ? '#ff6600' : '#f0f0f0', border: 'none', borderRadius: 20,
            padding: '7px 20px', cursor: canPost ? 'pointer' : 'default',
            color: canPost ? '#fff' : '#bbb',
            fontFamily: "'Oswald', sans-serif", fontSize: '0.72rem',
            letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
          }}>
            <Send style={{ width: 13, height: 13 }} />
            {threadMode ? 'POST ALL' : 'POST'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Single post in the feed ───────────────────────────────────────
const FeedPost = ({ comment, onLike, onReply, onDelete, onOpenReplies }) => {
  const parts      = comment.text?.split('\n\n──\n\n') || [comment.text || ''];
  const isThread   = parts.length > 1;
  const liked      = comment.likes?.includes(currentUserId());
  const isOwner    = comment.user === currentUserId() || comment.user?._id === currentUserId();
  const replyCount = comment.replies?.length || 0;

  return (
    <div style={{ borderBottom: '1px solid #f5f5f5' }}>
      <div style={{ display: 'flex', gap: 12, padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 38 }}>
          <Avatar name={comment.userName} size={38} />
          {(isThread || replyCount > 0) && <Connector />}
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingBottom: 2 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.8rem', fontWeight: 700, color: '#111', letterSpacing: '0.04em' }}>
                {comment.userName}
              </span>
              <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.65rem', color: '#bbb', marginLeft: 8, letterSpacing: '0.04em' }}>
                · {timeAgo(comment.createdAt)}
              </span>
              {isThread && (
                <span style={{
                  marginLeft: 8, background: '#fff3ec',
                  border: '1px solid rgba(255,102,0,0.2)', borderRadius: 10,
                  padding: '1px 7px', fontFamily: "'Oswald', sans-serif",
                  fontSize: '0.58rem', letterSpacing: '0.12em', color: '#cc5500',
                }}>THREAD</span>
              )}
            </div>
            {isOwner && (
              <button onClick={() => onDelete(comment._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', padding: 2, flexShrink: 0 }}
                onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                onMouseOut={e => e.currentTarget.style.color = '#ddd'}
              >
                <Trash2 style={{ width: 12, height: 12 }} />
              </button>
            )}
          </div>
          <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '0.9rem', color: '#111', lineHeight: 1.8, margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
            {parts[0]}
          </p>
          {isThread && (
            <button onClick={() => onOpenReplies(comment)} style={{
              display: 'flex', alignItems: 'center', gap: 6, marginTop: 10,
              background: 'none', border: '1px solid #ebebeb', borderRadius: 3,
              padding: '6px 12px', cursor: 'pointer',
              fontFamily: "'Oswald', sans-serif", fontSize: '0.65rem',
              letterSpacing: '0.1em', color: '#ff6600', transition: 'background 0.12s',
            }}
              onMouseOver={e => e.currentTarget.style.background = '#fff8f3'}
              onMouseOut={e => e.currentTarget.style.background = 'none'}
            >
              <Repeat2 style={{ width: 13, height: 13 }} />
              READ FULL THREAD · {parts.length} PARTS
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 6, marginLeft: -10 }}>
            <ActionBtn icon={<Reply style={{ width: 15, height: 15 }} />} label={replyCount} onClick={() => onOpenReplies(comment)} hoverColor="#ff6600" hoverBg="rgba(255,102,0,0.06)" />
            <ActionBtn icon={<Repeat2 style={{ width: 15, height: 15 }} />} hoverColor="#00ba7c" hoverBg="rgba(0,186,124,0.06)" />
            <ActionBtn icon={<ThumbsUp style={{ width: 15, height: 15 }} />} label={comment.likes?.length || 0} onClick={() => onLike(comment._id)} active={liked} hoverColor="#ff6600" hoverBg="rgba(255,102,0,0.06)" color={liked ? '#ff6600' : '#aaa'} />
            <ActionBtn icon={<Bookmark style={{ width: 15, height: 15 }} />} hoverColor="#1d9bf0" hoverBg="rgba(29,155,240,0.06)" />
          </div>
        </div>
      </div>
      {replyCount > 0 && (
        <button onClick={() => onOpenReplies(comment)} style={{
          display: 'block', width: '100%', background: 'none', border: 'none',
          padding: '8px 16px 10px 66px', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s',
        }}
          onMouseOver={e => e.currentTarget.style.background = '#fafafa'}
          onMouseOut={e => e.currentTarget.style.background = 'none'}
        >
          <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.65rem', letterSpacing: '0.12em', color: '#ff6600' }}>
            Show {replyCount} {replyCount === 1 ? 'reply' : 'replies'} ↓
          </span>
        </button>
      )}
    </div>
  );
};

// ── Expanded post view ────────────────────────────────────────────
const ExpandedPost = ({ comment, onLike, onLikeReply, onReply, onDelete, onClose }) => {
  const parts    = comment.text?.split('\n\n──\n\n') || [comment.text || ''];
  const isThread = parts.length > 1;
  const liked    = comment.likes?.includes(currentUserId());
  const replies  = comment.replies || [];

  return (
    <div style={{ background: '#fff', borderBottom: '2px solid #ff6600' }}>
      <button onClick={onClose} style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
        background: 'none', border: 'none', borderBottom: '1px solid #f0f0f0',
        padding: '11px 16px', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s',
      }}
        onMouseOver={e => e.currentTarget.style.background = '#fafafa'}
        onMouseOut={e => e.currentTarget.style.background = 'none'}
      >
        <ArrowLeft style={{ width: 15, height: 15, color: '#888' }} />
        <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.68rem', letterSpacing: '0.16em', color: '#888', textTransform: 'uppercase' }}>
          Back to feed
        </span>
      </button>

      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Avatar name={comment.userName} size={42} />
          <div>
            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.82rem', fontWeight: 700, color: '#111', letterSpacing: '0.04em' }}>
              {comment.userName}
            </div>
            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.63rem', color: '#bbb', letterSpacing: '0.04em' }}>
              {timeAgo(comment.createdAt)}
              {isThread && <span style={{ marginLeft: 8, color: '#cc5500' }}>· THREAD · {parts.length} PARTS</span>}
            </div>
          </div>
        </div>

        {parts.map((part, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 2, marginLeft: 20 }}>
              {idx > 0 && <div style={{ width: 2, height: 20, background: '#e8e8e8', borderRadius: 1, marginBottom: 4 }} />}
            </div>
            <div style={{ flex: 1, paddingBottom: idx < parts.length - 1 ? 0 : 12 }}>
              {idx > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Avatar name={comment.userName} size={28} />
                  <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.62rem', color: '#bbb', letterSpacing: '0.08em' }}>
                    Part {idx + 1}
                  </span>
                </div>
              )}
              <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '0.92rem', color: '#111', lineHeight: 1.82, margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
                {part}
              </p>
            </div>
          </div>
        ))}

        <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 12 }}>
          {(comment.likes?.length > 0 || replies.length > 0) && (
            <div style={{ padding: '10px 0 6px', display: 'flex', gap: 16 }}>
              {comment.likes?.length > 0 && (
                <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.72rem', color: '#555', letterSpacing: '0.06em' }}>
                  <strong style={{ color: '#111' }}>{comment.likes.length}</strong> like{comment.likes.length !== 1 ? 's' : ''}
                </span>
              )}
              {replies.length > 0 && (
                <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.72rem', color: '#555', letterSpacing: '0.06em' }}>
                  <strong style={{ color: '#111' }}>{replies.length}</strong> {replies.length === 1 ? 'reply' : 'replies'}
                </span>
              )}
            </div>
          )}
          <div style={{ display: 'flex', gap: 0, marginLeft: -10, paddingBottom: 4 }}>
            <ActionBtn icon={<Reply style={{ width: 15, height: 15 }} />} hoverColor="#ff6600" hoverBg="rgba(255,102,0,0.06)" />
            <ActionBtn icon={<Repeat2 style={{ width: 15, height: 15 }} />} hoverColor="#00ba7c" hoverBg="rgba(0,186,124,0.06)" />
            <ActionBtn icon={<ThumbsUp style={{ width: 15, height: 15 }} />} label={comment.likes?.length || 0} onClick={() => onLike(comment._id)} active={liked} color={liked ? '#ff6600' : '#aaa'} hoverColor="#ff6600" hoverBg="rgba(255,102,0,0.06)" />
            <ActionBtn icon={<Share2 style={{ width: 15, height: 15 }} />} hoverColor="#1d9bf0" hoverBg="rgba(29,155,240,0.06)" />
          </div>
        </div>
      </div>

      {replies.length > 0 && (
        <div style={{ borderTop: '1px solid #f0f0f0' }}>
          <div style={{ padding: '8px 16px 4px' }}>
            <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.65rem', letterSpacing: '0.18em', color: '#bbb', textTransform: 'uppercase' }}>
              {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
            </span>
          </div>
          {replies.map((reply, idx) => {
            const replyLiked = reply.likes?.includes(currentUserId());
            const replyOwner = reply.user === currentUserId() || reply.user?._id === currentUserId();
            return (
              <div key={reply._id} style={{ borderBottom: idx < replies.length - 1 ? '1px solid #f9f9f9' : 'none' }}>
                <div style={{ display: 'flex', gap: 12, padding: '12px 16px 0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 34 }}>
                    <Avatar name={reply.userName} size={34} />
                    {idx < replies.length - 1 && <Connector />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, paddingBottom: idx < replies.length - 1 ? 4 : 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                      <div>
                        <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.75rem', fontWeight: 700, color: '#111', letterSpacing: '0.04em' }}>
                          {reply.userName}
                        </span>
                        <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.62rem', color: '#bbb', marginLeft: 6, letterSpacing: '0.04em' }}>
                          · {timeAgo(reply.createdAt)}
                        </span>
                      </div>
                      {replyOwner && (
                        <button onClick={() => onDelete(comment._id, reply._id, true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', padding: 2 }}
                          onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseOut={e => e.currentTarget.style.color = '#ddd'}
                        >
                          <Trash2 style={{ width: 11, height: 11 }} />
                        </button>
                      )}
                    </div>
                    <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '0.88rem', color: '#111', lineHeight: 1.78, margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
                      {reply.text}
                    </p>
                    <div style={{ display: 'flex', gap: 0, marginTop: 4, marginLeft: -10 }}>
                      <ActionBtn icon={<ThumbsUp style={{ width: 13, height: 13 }} />} label={reply.likes?.length || 0} onClick={() => onLikeReply(comment._id, reply._id)} active={replyLiked} color={replyLiked ? '#ff6600' : '#aaa'} hoverColor="#ff6600" hoverBg="rgba(255,102,0,0.06)" />
                      <ActionBtn icon={<Reply style={{ width: 13, height: 13 }} />} hoverColor="#ff6600" hoverBg="rgba(255,102,0,0.06)" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isLoggedIn() && (
        <div style={{ borderTop: '1px solid #f0f0f0' }}>
          <ComposeBox
            placeholder={`Reply to ${comment.userName}... (min ${MIN_WORDS} words)`}
            replyTo={comment.userName}
            isReply
            onSubmit={async (text) => { await onReply(comment._id, text, null); }}
          />
        </div>
      )}
    </div>
  );
};

// ── Main CommentSection ───────────────────────────────────────────
// Props:
//   sourceType  : 'market' | 'news'
//   marketType  : 'stocks' | 'forex' | 'goods'   (when sourceType='market')
//   sym         : string                           (when sourceType='market')
//   newsId      : string                           (when sourceType='news')
//   newsTitle   : string                           (when sourceType='news')
//   itemName    : display name for placeholder
const CommentSection = ({ sourceType = 'market', marketType, sym, newsId, newsTitle, itemName }) => {
  const [comments,  setComments]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [expanded,  setExpanded]  = useState(null);

  // Build API endpoint based on source type
  const endpoint = sourceType === 'news'
    ? `${API}/comments/news/${newsId}`
    : `${API}/comments/market/${marketType}/${sym}`;

  const fetchComments = useCallback(async () => {
    if (!isLoggedIn()) { setLoading(false); return; }
    try {
      const res  = await fetch(endpoint, { headers: authHeaders() });
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch { setError('Failed to load comments'); }
    finally { setLoading(false); }
  }, [endpoint]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const submitComment = async (text) => {
    if (!isLoggedIn()) return;
    try {
      const body = sourceType === 'news'
        ? { text, newsTitle }
        : { text };
      const res = await fetch(endpoint, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
      });
      if (!res.ok) return;
      const c = await res.json();
      setComments(prev => [c, ...prev]);
    } catch {}
  };

  const handleLike = async (commentId) => {
    if (!isLoggedIn()) return;
    try {
      const res = await fetch(`${API}/comments/${commentId}/like`, { method: 'PATCH', headers: authHeaders() });
      if (!res.ok) return;
      const { liked } = await res.json();
      const uid = currentUserId();
      setComments(prev => prev.map(c => {
        if (c._id !== commentId) return c;
        const likes = liked ? [...(c.likes || []), uid] : (c.likes || []).filter(id => id !== uid);
        return { ...c, likes };
      }));
    } catch {}
  };

  const handleLikeReply = async (commentId, replyId) => {
    if (!isLoggedIn()) return;
    try {
      const res = await fetch(`${API}/comments/${commentId}/replies/${replyId}/like`, { method: 'PATCH', headers: authHeaders() });
      if (!res.ok) return;
      const { liked } = await res.json();
      const uid = currentUserId();
      setComments(prev => prev.map(c => {
        if (c._id !== commentId) return c;
        return {
          ...c,
          replies: c.replies.map(r => {
            if (r._id !== replyId) return r;
            const likes = liked ? [...(r.likes || []), uid] : (r.likes || []).filter(id => id !== uid);
            return { ...r, likes };
          }),
        };
      }));
    } catch {}
  };

  const handleReply = async (commentId, replyText, parentReplyId = null) => {
    try {
      const res = await fetch(`${API}/comments/${commentId}/replies`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ text: replyText, parentReplyId }),
      });
      if (!res.ok) return;
      const updated = await res.json();
      setComments(prev => prev.map(c => c._id === commentId ? updated : c));
    } catch {}
  };

  const handleDelete = async (commentId) => {
    try {
      const res = await fetch(`${API}/comments/${commentId}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) return;
      setComments(prev => prev.filter(c => c._id !== commentId));
      if (expanded === commentId) setExpanded(null);
    } catch {}
  };

  const totalReplies    = comments.reduce((sum, c) => sum + (c.replies?.length || 0), 0);
  const expandedComment = expanded ? comments.find(c => c._id === expanded) : null;

  // Label differs for news vs market
  const sectionLabel    = sourceType === 'news' ? 'Article Discussion' : 'Market Opinions';
  const composePlaceholder = sourceType === 'news'
    ? `What do you think about this article? (min ${MIN_WORDS} words)`
    : `What's your take on ${itemName}? (min ${MIN_WORDS} words)`;

  return (
    <div style={{ background: '#ffffff', borderTop: '1px solid #ebebeb' }}>
      <button
        onClick={() => { setCollapsed(v => !v); setExpanded(null); }}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '13px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: collapsed ? 'none' : '1px solid #f0f0f0', transition: 'background 0.15s',
        }}
        onMouseOver={e => e.currentTarget.style.background = '#fafafa'}
        onMouseOut={e => e.currentTarget.style.background = 'none'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MessageCircle style={{ width: 15, height: 15, color: '#ff6600' }} />
          <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.72rem', letterSpacing: '0.22em', color: '#ff6600', textTransform: 'uppercase' }}>
            {sectionLabel}
          </span>
          {(comments.length + totalReplies) > 0 && (
            <span style={{
              background: '#fff3ec', border: '1px solid rgba(255,102,0,0.2)',
              borderRadius: 10, padding: '1px 8px',
              fontFamily: "'Oswald', sans-serif", fontSize: '0.63rem', color: '#cc4400', letterSpacing: '0.1em',
            }}>
              {comments.length + totalReplies}
            </span>
          )}
        </div>
        <ChevronDown style={{
          width: 14, height: 14, color: '#bbb',
          transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
          transition: 'transform 0.2s',
        }} />
      </button>

      {!collapsed && (
        <>
          {expandedComment ? (
            <ExpandedPost
              comment={expandedComment}
              onLike={handleLike}
              onLikeReply={handleLikeReply}
              onReply={handleReply}
              onDelete={handleDelete}
              onClose={() => setExpanded(null)}
            />
          ) : (
            <>
              {isLoggedIn() ? (
                <ComposeBox placeholder={composePlaceholder} onSubmit={submitComment} />
              ) : (
                <div style={{ padding: '20px 16px', borderBottom: '1px solid #f0f0f0', textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic', fontSize: '0.85rem', color: '#bbb', margin: 0 }}>
                    Sign in to share your thoughts.
                  </p>
                </div>
              )}

              {error && (
                <div style={{ padding: '8px 16px', fontFamily: "'Oswald', sans-serif", fontSize: '0.68rem', color: '#ef4444' }}>
                  ⚠ {error}
                </div>
              )}

              {!isLoggedIn() ? (
                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic', fontSize: '0.85rem', color: '#ccc', margin: 0 }}>
                    Sign in to read and join the discussion.
                  </p>
                </div>
              ) : loading ? (
                <div style={{ padding: '16px' }}>
                  {[...Array(2)].map((_, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#f0f0f0', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 11, background: '#f0f0f0', borderRadius: 2, marginBottom: 8, width: '28%' }} />
                        <div style={{ height: 11, background: '#f5f5f5', borderRadius: 2, marginBottom: 6 }} />
                        <div style={{ height: 11, background: '#f5f5f5', borderRadius: 2, width: '65%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <div style={{ padding: '36px 16px', textAlign: 'center' }}>
                  <MessageCircle style={{ width: 28, height: 28, color: '#e8e8e8', margin: '0 auto 10px', display: 'block' }} />
                  <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.7rem', letterSpacing: '0.18em', color: '#ccc', textTransform: 'uppercase', margin: '0 0 6px' }}>
                    No discussion yet
                  </p>
                  <p style={{ fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic', fontSize: '0.82rem', color: '#bbb', margin: 0 }}>
                    Be the first to share your analysis.
                  </p>
                </div>
              ) : (
                <div>
                  {comments.map(comment => (
                    <FeedPost
                      key={comment._id}
                      comment={comment}
                      onLike={handleLike}
                      onReply={handleReply}
                      onDelete={handleDelete}
                      onOpenReplies={(c) => setExpanded(c._id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CommentSection;