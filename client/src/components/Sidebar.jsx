import { useState } from "react";
import { Icons, Avatar, StatusDot } from "./Icons";

const ROOM_ICONS = { general: <Icons.Globe size={14} />, "tech-talk": <Icons.Hash size={14} />, random: <Icons.MessageCircle size={14} />, music: <Icons.Hash size={14} /> };

export default function Sidebar({ rooms, allUsers, onlineUsers, activeRoom, unread, onSelectRoom, onSelectDm, onLogout, user, connected, onCreateRoom }) {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", desc: "" });
  const [activeNav, setActiveNav] = useState("chat");

  const onlineIds = new Set(onlineUsers.map((u) => u._id));
  const filtered = allUsers.filter((u) => u.username.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    if (!newRoom.name.trim()) return;
    await onCreateRoom(newRoom.name, newRoom.desc, "💬");
    setShowCreate(false);
    setNewRoom({ name: "", desc: "" });
  };

  return (
    <>
      {/* ── Nav Rail ── */}
      <div style={rail.wrap}>
        <div style={rail.logo}>
          <Icons.Chat />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {[
            { id: "chat", icon: <Icons.Chat />, label: "Channels" },
            { id: "bell", icon: <Icons.Bell />, label: "Notifications" },
            { id: "search", icon: <Icons.Search />, label: "Search" },
          ].map(({ id, icon, label }) => (
            <button key={id} title={label} onClick={() => setActiveNav(id)}
              style={{ ...rail.navBtn, background: activeNav === id ? "var(--accent-bg)" : "transparent", color: activeNav === id ? "var(--accent)" : "var(--text2)", borderLeft: activeNav === id ? "2px solid var(--accent)" : "2px solid transparent" }}>
              {icon}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingBottom: 8 }}>
          {/* Connection indicator */}
          <div title={connected ? "Connected" : "Disconnected"} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: connected ? "var(--green)" : "var(--red)" }}>
            <Icons.Wifi off={!connected} />
          </div>
          <button title="Settings" style={rail.iconBtn}><Icons.Settings /></button>
          <button title="Logout" onClick={onLogout} style={{ ...rail.iconBtn, color: "var(--red)" }}><Icons.Logout /></button>
          {user && (
            <div style={{ position: "relative", marginTop: 4 }}>
              <Avatar name={user.username} color={user.avatar?.color} size={32} />
              <div style={{ position: "absolute", bottom: 0, right: 0 }}><StatusDot status="online" /></div>
            </div>
          )}
        </div>
      </div>

      {/* ── Channel List ── */}
      <div style={side.wrap}>
        {/* Header */}
        <div style={side.header}>
          <div style={side.workspaceName}>ChatSpace</div>
          <div style={side.searchBox}>
            <Icons.Search />
            <input style={side.searchInput} placeholder="Search people..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {/* Channels */}
          <div style={side.sectionHeader}>
            <span style={side.sectionLabel}>Channels</span>
            <button onClick={() => setShowCreate(true)} style={side.addBtn} title="New channel">
              <Icons.Plus size={14} />
            </button>
          </div>

          {rooms.filter(r => r.type === "public").map((room) => {
            const isActive = activeRoom?._id === room._id;
            const hasUnread = unread[room._id] > 0;
            return (
              <button key={room._id} onClick={() => onSelectRoom(room)} style={{ ...side.roomBtn, background: isActive ? "var(--accent-bg)" : "transparent", color: isActive ? "var(--accent)" : hasUnread ? "var(--text)" : "var(--text2)", fontWeight: isActive || hasUnread ? 600 : 400, borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent" }}
                onMouseEnter={e => !isActive && (e.currentTarget.style.background = "var(--surface2)")}
                onMouseLeave={e => !isActive && (e.currentTarget.style.background = "transparent")}>
                <span style={{ color: isActive ? "var(--accent)" : "var(--text3)" }}>
                  {ROOM_ICONS[room.name] || <Icons.Hash size={14} />}
                </span>
                <span style={{ flex: 1, textAlign: "left" }}>{room.name}</span>
                {hasUnread && (
                  <span style={side.badge}>{unread[room._id]}</span>
                )}
              </button>
            );
          })}

          {/* DMs */}
          <div style={{ ...side.sectionHeader, marginTop: 8 }}>
            <span style={side.sectionLabel}>Direct Messages</span>
          </div>

          {filtered.map((u) => {
            const isOnline = onlineIds.has(u._id);
            return (
              <button key={u._id} onClick={() => onSelectDm(u._id)}
                style={{ ...side.dmBtn }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ position: "relative" }}>
                  <Avatar name={u.username} color={u.avatar?.color} size={26} />
                  <div style={{ position: "absolute", bottom: -1, right: -1 }}>
                    <StatusDot status={isOnline ? "online" : "offline"} />
                  </div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text2)", flex: 1, textAlign: "left" }}>{u.username}</span>
                {isOnline && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--online)", flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreate && (
        <div style={modal.overlay} onClick={() => setShowCreate(false)}>
          <div style={modal.box} onClick={e => e.stopPropagation()}>
            <div style={modal.title}>
              <Icons.Plus size={18} />
              Create Channel
            </div>
            <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20 }}>New channels are public by default</p>

            <MiniField label="Channel Name" placeholder="e.g. design-feedback" value={newRoom.name} onChange={e => setNewRoom(p => ({ ...p, name: e.target.value }))} />
            <MiniField label="Description (optional)" placeholder="What's this channel about?" value={newRoom.desc} onChange={e => setNewRoom(p => ({ ...p, desc: e.target.value }))} />

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={() => setShowCreate(false)} style={modal.cancelBtn}>Cancel</button>
              <button onClick={handleCreate} style={modal.createBtn}>
                <Icons.Plus size={14} /> Create Channel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MiniField({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6, letterSpacing: ".5px", textTransform: "uppercase" }}>{label}</label>
      <input style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text)", fontSize: 13, outline: "none" }}
        onFocus={e => e.target.style.borderColor = "var(--accent)"}
        onBlur={e => e.target.style.borderColor = "var(--border)"}
        {...props} />
    </div>
  );
}

const rail = {
  wrap: { width: 56, background: "#0a0e14", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: 4 },
  logo: { width: 36, height: 36, borderRadius: 12, background: "linear-gradient(135deg,var(--accent),#0d9488)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0e1117", marginBottom: 16, boxShadow: "0 0 16px rgba(45,212,191,.3)", flexShrink: 0 },
  navBtn: { width: 40, height: 36, borderRadius: 8, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .15s" },
  iconBtn: { width: 34, height: 34, borderRadius: 8, border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text2)", transition: "color .15s" },
};

const side = {
  wrap: { background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden", width: 240 },
  header: { padding: "16px 14px 12px", borderBottom: "1px solid var(--border)" },
  workspaceName: { fontWeight: 800, fontSize: 15, letterSpacing: "-.3px", marginBottom: 10 },
  searchBox: { display: "flex", alignItems: "center", gap: 8, background: "var(--surface2)", borderRadius: 8, padding: "7px 10px", border: "1px solid var(--border)", color: "var(--text2)" },
  searchInput: { background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 13, width: "100%" },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 4px" },
  sectionLabel: { fontSize: 10, fontWeight: 700, letterSpacing: "1px", color: "var(--text3)", textTransform: "uppercase" },
  addBtn: { width: 22, height: 22, borderRadius: 6, border: "none", background: "transparent", color: "var(--text2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  roomBtn: { width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", border: "none", cursor: "pointer", transition: "all .12s", fontSize: 13 },
  dmBtn: { width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", border: "none", background: "transparent", cursor: "pointer", transition: "background .12s", borderRadius: 0 },
  badge: { background: "var(--accent)", color: "#0e1117", fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" },
};

const modal = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" },
  box: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 28, width: 360, boxShadow: "0 24px 64px rgba(0,0,0,.5)", animation: "fadeUp .3s cubic-bezier(.16,1,.3,1)" },
  title: { fontWeight: 800, fontSize: 18, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 },
  cancelBtn: { flex: 1, padding: 11, borderRadius: 10, background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text2)", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  createBtn: { flex: 1, padding: 11, borderRadius: 10, background: "var(--accent)", border: "none", color: "#0e1117", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 },
};
