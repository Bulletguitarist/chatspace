import { Icons, Avatar, StatusDot } from "./Icons";

export default function MembersPanel({ activeRoom, allUsers, onlineUsers, user, onOpenDm, messages }) {
  const onlineIds = new Set(onlineUsers.map(u => u._id));
  const onlineList = allUsers.filter(u => onlineIds.has(u._id));
  const offlineList = allUsers.filter(u => !onlineIds.has(u._id));
  const msgCount = messages?.length || 0;

  return (
    <div style={{ background: "var(--surface)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden", width: 240 }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
        <Icons.Users />
        <span style={{ fontWeight: 700, fontSize: 14 }}>Members</span>
        <span style={{ fontSize: 12, color: "var(--text2)", marginLeft: "auto" }}>{allUsers.length + 1}</span>
      </div>

      <div style={{ overflowY: "auto", flex: 1, padding: "10px 8px" }}>

        {/* Stats card */}
        <div style={p.statsCard}>
          <div style={p.statsTitle}>
            <Icons.MessageCircle size={12} />
            Room Stats
          </div>
          {[
            ["Online", `${onlineList.length + 1}`],
            ["Messages", `${msgCount}`],
            ["Channel", activeRoom ? (activeRoom.type === "dm" ? "DM" : `#${activeRoom.name}`) : "—"],
          ].map(([k, v]) => (
            <div key={k} style={p.statRow}>
              <span style={{ color: "var(--text2)", fontSize: 12 }}>{k}</span>
              <span style={{ fontWeight: 700, fontSize: 12, color: "var(--accent)" }}>{v}</span>
            </div>
          ))}
        </div>

        {/* You */}
        <SectionLabel label="You" />
        {user && (
          <MemberCard
            u={{ username: user.username, avatar: user.avatar }}
            status="online"
            isYou
          />
        )}

        {/* Online */}
        {onlineList.length > 0 && (
          <>
            <SectionLabel label={`Online — ${onlineList.length}`} />
            {onlineList.map(u => (
              <MemberCard key={u._id} u={u} status="online" onClick={() => onOpenDm(u._id)} />
            ))}
          </>
        )}

        {/* Offline */}
        {offlineList.length > 0 && (
          <>
            <SectionLabel label={`Offline — ${offlineList.length}`} />
            {offlineList.map(u => (
              <MemberCard key={u._id} u={u} status="offline" onClick={() => onOpenDm(u._id)} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ label }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", color: "var(--text3)", textTransform: "uppercase", padding: "10px 8px 4px" }}>
      {label}
    </div>
  );
}

function MemberCard({ u, status, isYou, onClick }) {
  return (
    <div onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8, cursor: isYou ? "default" : "pointer", transition: "background .12s" }}
      onMouseEnter={e => !isYou && (e.currentTarget.style.background = "var(--surface2)")}
      onMouseLeave={e => !isYou && (e.currentTarget.style.background = "transparent")}>
      <div style={{ position: "relative" }}>
        <Avatar name={u.username} color={u.avatar?.color} size={30} />
        <div style={{ position: "absolute", bottom: -1, right: -1 }}>
          <StatusDot status={status} />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.username}</span>
          {isYou && <span style={{ fontSize: 9, background: "var(--accent)", padding: "1px 5px", borderRadius: 4, color: "#0e1117", fontWeight: 700, flexShrink: 0 }}>YOU</span>}
        </div>
        <div style={{ fontSize: 11, color: status === "online" ? "var(--green)" : "var(--text3)", textTransform: "capitalize", display: "flex", alignItems: "center", gap: 4 }}>
          {status === "online" ? "● Online" : "○ Offline"}
        </div>
      </div>
      {!isYou && (
        <button onClick={e => { e.stopPropagation(); onClick(); }}
          style={{ width: 26, height: 26, borderRadius: 6, border: "none", background: "transparent", color: "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          title="Send DM">
          <Icons.MessageCircle size={13} />
        </button>
      )}
    </div>
  );
}

const p = {
  statsCard: { background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px", marginBottom: 8 },
  statsTitle: { fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 },
  statRow: { display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)" },
};
