import { useState, useEffect, useRef, useCallback } from "react";
import { Icons, Avatar } from "./Icons";

const EMOJIS = ["👍","❤️","😂","😮","😢","🔥","🎉","👀","✅","💯"];

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(ts) {
  const d = new Date(ts), today = new Date(), yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ChatWindow({ activeRoom, messages, user, typingUsers, loading, allUsers, onlineUsers, onSend, onTyping, onReact, onEdit, onDelete }) {
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [hoveredMsg, setHoveredMsg] = useState(null);
  const [showEmojiFor, setShowEmojiFor] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimer = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typingUsers.size]);
  useEffect(() => { inputRef.current?.focus(); }, [activeRoom?._id]);

  const handleInput = (e) => {
    setInput(e.target.value);
    if (!isTypingRef.current) { onTyping(true); isTypingRef.current = true; }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => { onTyping(false); isTypingRef.current = false; }, 2000);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
    onTyping(false); isTypingRef.current = false;
    clearTimeout(typingTimer.current);
  };

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const getUserInfo = (senderId) => {
    const id = senderId?._id || senderId;
    if (id === user._id) return { username: user.username, color: user.avatar?.color };
    const found = allUsers.find(u => u._id === id);
    return found ? { username: found.username, color: found.avatar?.color } : { username: "Unknown", color: "#666" };
  };

  // Group by date + consecutive sender
  const grouped = [];
  let lastDate = null;
  messages.forEach((msg, i) => {
    const d = fmtDate(msg.createdAt || msg.ts);
    if (d !== lastDate) { grouped.push({ type: "date", label: d }); lastDate = d; }
    const prev = messages[i - 1];
    const prevId = prev?.sender?._id || prev?.sender;
    const curId = msg.sender?._id || msg.sender;
    const sameGroup = prev && prevId === curId && new Date(msg.createdAt) - new Date(prev.createdAt) < 300000 && fmtDate(msg.createdAt) === fmtDate(prev.createdAt);
    grouped.push({ type: "msg", msg, showHeader: !sameGroup });
  });

  const typingArr = [...typingUsers];
  const typingText = typingArr.length === 1 ? `${typingArr[0]} is typing...`
    : typingArr.length === 2 ? `${typingArr[0]} and ${typingArr[1]} are typing...`
    : typingArr.length > 2 ? "Several people are typing..." : null;

  const dmOther = activeRoom?.type === "dm"
    ? allUsers.find(u => activeRoom.dmUsers?.some(id => id === u._id || id?.toString() === u._id))
    : null;
  const dmOtherOnline = dmOther && onlineUsers.some(u => u._id === dmOther._id);

  if (!activeRoom) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, color: "var(--text2)" }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)" }}>
        <Icons.Chat />
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: "var(--text)", marginBottom: 4 }}>No channel selected</div>
        <div style={{ fontSize: 13 }}>Pick a channel or DM from the sidebar</div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg)", flex: 1 }}>
      {/* Header */}
      <div style={cw.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          {activeRoom.type === "dm" && dmOther
            ? <div style={{ position: "relative" }}>
                <Avatar name={dmOther.username} color={dmOther.avatar?.color} size={32} />
                <div style={{ position: "absolute", bottom: 0, right: 0, width: 9, height: 9, borderRadius: "50%", background: dmOtherOnline ? "var(--online)" : "var(--offline)", border: "2px solid var(--bg)" }} />
              </div>
            : <div style={{ color: "var(--text2)" }}><Icons.Hash /></div>
          }
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {activeRoom.type === "dm" ? dmOther?.username || "DM" : activeRoom.name}
            </div>
            <div style={{ fontSize: 11, color: "var(--text2)" }}>
              {activeRoom.type === "dm"
                ? dmOtherOnline ? "● Online" : "○ Offline"
                : activeRoom.description || "Public channel"
              }
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <HeaderBtn title="Members"><Icons.Users /></HeaderBtn>
          <HeaderBtn title="Pin"><Icons.Pin /></HeaderBtn>
          <HeaderBtn title="More"><Icons.MoreHorizontal /></HeaderBtn>
        </div>
      </div>

      {/* Messages */}
      <div style={cw.msgArea}>
        {loading && (
          <div style={{ color: "var(--text2)", textAlign: "center", padding: 32, fontSize: 13 }}>
            Loading messages...
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 10, color: "var(--text2)", paddingBottom: 40 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)" }}>
              <Icons.MessageCircle size={24} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
                {activeRoom.type === "dm" ? `Start a DM with ${dmOther?.username}` : `Welcome to #${activeRoom.name}`}
              </div>
              <div style={{ fontSize: 12 }}>Be the first to say something!</div>
            </div>
          </div>
        )}

        {grouped.map((item, i) => {
          if (item.type === "date") return (
            <div key={`d-${i}`} style={cw.dateDivider}>
              <div style={cw.dateLine} />
              <span style={cw.dateLabel}>{item.label}</span>
              <div style={cw.dateLine} />
            </div>
          );

          const { msg, showHeader } = item;
          const senderId = msg.sender?._id || msg.sender;
          const isOwn = senderId === user._id;
          const info = isOwn ? { username: user.username, color: user.avatar?.color } : getUserInfo(msg.sender);

          return (
            <div key={msg._id}
              style={{ display: "flex", gap: 10, padding: showHeader ? "10px 20px 2px" : "1px 20px", flexDirection: "row", alignItems: "flex-start", position: "relative", animation: "fadeUp .2s ease" }}
              onMouseEnter={() => setHoveredMsg(msg._id)}
              onMouseLeave={() => { setHoveredMsg(null); setShowEmojiFor(null); }}>

              {/* Avatar col */}
              <div style={{ width: 36, flexShrink: 0 }}>
                {showHeader
                  ? <Avatar name={info.username} color={info.color} size={34} />
                  : <span style={{ fontSize: 10, color: "var(--text3)", display: "block", textAlign: "center", paddingTop: 4, fontFamily: "'JetBrains Mono',monospace", opacity: hoveredMsg === msg._id ? 1 : 0 }}>
                      {fmtTime(msg.createdAt || msg.ts)}
                    </span>
                }
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {showHeader && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: info.color || "var(--text)" }}>{isOwn ? `${user.username} (you)` : info.username}</span>
                    <span style={{ fontSize: 11, color: "var(--text3)", fontFamily: "'JetBrains Mono',monospace" }}>{fmtTime(msg.createdAt || msg.ts)}</span>
                    {isOwn && <span style={{ color: "var(--accent)", fontSize: 11 }}><Icons.CheckCheck /></span>}
                  </div>
                )}

                {/* Bubble or edit */}
                {editingId === msg._id ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                    <input value={editText} onChange={e => setEditText(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { onEdit(editingId, editText); setEditingId(null); } if (e.key === "Escape") setEditingId(null); }}
                      autoFocus style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--accent)", borderRadius: 8, padding: "7px 12px", color: "var(--text)", fontSize: 14, outline: "none" }} />
                    <button onClick={() => { onEdit(editingId, editText); setEditingId(null); }} style={cw.editSave}>Save</button>
                    <button onClick={() => setEditingId(null)} style={cw.editCancel}>✕</button>
                  </div>
                ) : (
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: msg.deleted ? "var(--text3)" : "var(--text)", fontStyle: msg.deleted ? "italic" : "normal", wordBreak: "break-word" }}>
                    {msg.deleted ? "This message was deleted." : msg.text}
                    {msg.edited && !msg.deleted && <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: 6 }}>(edited)</span>}
                  </div>
                )}

                {/* Reactions */}
                {msg.reactions?.filter(r => r.users.length > 0).length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                    {msg.reactions.filter(r => r.users.length > 0).map(r => (
                      <button key={r.emoji} onClick={() => onReact(msg._id, r.emoji)}
                        style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 20, padding: "2px 8px", fontSize: 13, cursor: "pointer", color: "var(--text)", display: "flex", alignItems: "center", gap: 4 }}>
                        {r.emoji} <span style={{ fontSize: 11, color: "var(--text2)" }}>{r.users.length}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Hover action toolbar */}
              {hoveredMsg === msg._id && !msg.deleted && (
                <div style={cw.toolbar}>
                  <ToolBtn title="React" onClick={() => setShowEmojiFor(showEmojiFor === msg._id ? null : msg._id)}>
                    <Icons.Smile />
                  </ToolBtn>
                  {isOwn && <ToolBtn title="Edit" onClick={() => { setEditingId(msg._id); setEditText(msg.text); setHoveredMsg(null); }}>
                    <Icons.Edit />
                  </ToolBtn>}
                  {isOwn && <ToolBtn title="Delete" onClick={() => onDelete(msg._id)} danger>
                    <Icons.Trash />
                  </ToolBtn>}
                </div>
              )}

              {/* Emoji picker */}
              {showEmojiFor === msg._id && (
                <div style={cw.emojiPicker}>
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => { onReact(msg._id, e); setShowEmojiFor(null); }}
                      style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", padding: "4px 6px", borderRadius: 6 }}
                      onMouseEnter={ev => ev.currentTarget.style.background = "var(--surface2)"}
                      onMouseLeave={ev => ev.currentTarget.style.background = "none"}>
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingText && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 20px", minHeight: 28 }}>
            <div style={{ display: "flex", gap: 3 }}>
              {[0, 150, 300].map(d => (
                <div key={d} style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--text3)", animation: `bounce .9s ${d}ms infinite` }} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: "var(--text2)" }}>{typingText}</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={cw.inputArea}>
        <div style={cw.inputWrap}>
          <button title="Emoji" style={cw.inputIconBtn}><Icons.Smile /></button>
          <textarea ref={inputRef} value={input} onChange={handleInput} onKeyDown={handleKey} rows={1}
            placeholder={`Message ${activeRoom.type === "dm" ? dmOther?.username || "" : "#" + activeRoom.name}...`}
            style={cw.textarea} />
          <button title="Attach" style={cw.inputIconBtn}><Icons.Paperclip /></button>
          <button onClick={handleSend} disabled={!input.trim()} style={{ ...cw.sendBtn, opacity: input.trim() ? 1 : .4, background: input.trim() ? "var(--accent)" : "var(--surface3)" }}>
            <Icons.Send />
          </button>
        </div>
        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 6, paddingLeft: 4 }}>
          Enter to send · Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}

function HeaderBtn({ children, title }) {
  return (
    <button title={title} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", color: "var(--text2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--surface2)"; e.currentTarget.style.color = "var(--text)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text2)"; }}>
      {children}
    </button>
  );
}

function ToolBtn({ children, title, onClick, danger }) {
  return (
    <button title={title} onClick={onClick}
      style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", color: danger ? "var(--red)" : "var(--text2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--surface3)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
      {children}
    </button>
  );
}

const cw = {
  header: { padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", flexShrink: 0 },
  msgArea: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", paddingTop: 16 },
  dateDivider: { display: "flex", alignItems: "center", gap: 12, padding: "8px 20px" },
  dateLine: { flex: 1, height: 1, background: "var(--border)" },
  dateLabel: { fontSize: 11, color: "var(--text3)", fontWeight: 600, whiteSpace: "nowrap", padding: "0 4px" },
  inputArea: { padding: "12px 16px 14px", borderTop: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 },
  inputWrap: { display: "flex", alignItems: "center", gap: 8, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 12, padding: "6px 10px", transition: "border-color .2s" },
  textarea: { flex: 1, background: "none", border: "none", outline: "none", color: "var(--text)", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, resize: "none", maxHeight: 120, lineHeight: 1.5 },
  inputIconBtn: { background: "none", border: "none", color: "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", borderRadius: 6, padding: 4 },
  sendBtn: { width: 34, height: 34, borderRadius: 8, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#0e1117", flexShrink: 0, transition: "all .2s" },
  toolbar: { position: "absolute", right: 20, top: -4, display: "flex", gap: 2, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "3px 4px", boxShadow: "0 4px 16px rgba(0,0,0,.3)", zIndex: 10 },
  emojiPicker: { position: "absolute", right: 20, top: 28, display: "flex", flexWrap: "wrap", gap: 2, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "8px 10px", zIndex: 20, maxWidth: 230, boxShadow: "0 8px 32px rgba(0,0,0,.4)" },
  editSave: { background: "var(--accent)", border: "none", color: "#0e1117", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  editCancel: { background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text2)", borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer" },
};
