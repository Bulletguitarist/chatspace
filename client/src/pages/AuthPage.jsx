import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Icons } from "../components/Icons";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register(form.username, form.email, form.password);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.grid} />
      <div style={s.glow} />

      <div style={s.card}>
        <div style={s.logoWrap}>
          <div style={s.logo}><Icons.Chat /></div>
          <div>
            <div style={s.logoTitle}>ChatSpace</div>
            <div style={s.logoBadge}>Real-time · Secure · Fast</div>
          </div>
        </div>

        <h2 style={s.title}>{mode === "login" ? "Welcome back" : "Create account"}</h2>
        <p style={s.sub}>{mode === "login" ? "Sign in to continue" : "Join the conversation"}</p>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "register" && (
            <Field label="Username" placeholder="cooluser123" value={form.username} onChange={set("username")} />
          )}
          <Field label="Email address" placeholder="you@example.com" type="email" value={form.email} onChange={set("email")} />
          <div>
            <label style={s.label}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={set("password")}
                style={{ ...s.input, paddingRight: 60 }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
              <button type="button" onClick={() => setShowPass(p => !p)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text2)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {showPass ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <div style={s.error}>⚠ {error}</div>
          )}

          <button style={{ ...s.btn, opacity: loading ? .7 : 1 }} type="submit" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
          </button>
        </form>

        <p style={s.toggle}>
          {mode === "login" ? "Don't have an account? " : "Already have one? "}
          <span style={s.link} onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
            {mode === "login" ? "Register here" : "Sign in"}
          </span>
        </p>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <input style={s.input}
        onFocus={e => e.target.style.borderColor = "var(--accent)"}
        onBlur={e => e.target.style.borderColor = "var(--border)"}
        {...props} />
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", position: "relative", overflow: "hidden" },
  grid: { position: "absolute", inset: 0, opacity: .04, backgroundImage: "linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)", backgroundSize: "40px 40px" },
  glow: { position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 300, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(45,212,191,.12) 0%,transparent 70%)", pointerEvents: "none" },
  card: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 40, width: 400, boxShadow: "0 24px 64px rgba(0,0,0,.5)", position: "relative", zIndex: 1, animation: "fadeUp .4s cubic-bezier(.16,1,.3,1)" },
  logoWrap: { display: "flex", alignItems: "center", gap: 12, marginBottom: 28 },
  logo: { width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg,var(--accent),#0d9488)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0e1117", boxShadow: "0 0 24px rgba(45,212,191,.3)" },
  logoTitle: { fontWeight: 800, fontSize: 18, letterSpacing: "-.5px" },
  logoBadge: { fontSize: 11, color: "var(--accent)", fontWeight: 500 },
  title: { fontWeight: 800, fontSize: 24, letterSpacing: "-.5px", marginBottom: 4 },
  sub: { fontSize: 13, color: "var(--text2)", marginBottom: 24 },
  label: { fontSize: 11, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6, letterSpacing: ".5px", textTransform: "uppercase" },
  input: { width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "11px 14px", color: "var(--text)", fontSize: 14, outline: "none", transition: "border-color .2s" },
  error: { background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--red)" },
  btn: { padding: "13px 20px", borderRadius: 12, background: "linear-gradient(135deg,var(--accent),#0d9488)", border: "none", color: "#0e1117", fontWeight: 700, fontSize: 14, transition: "all .2s", boxShadow: "0 4px 20px rgba(45,212,191,.25)", marginTop: 4 },
  toggle: { marginTop: 20, textAlign: "center", fontSize: 13, color: "var(--text2)" },
  link: { color: "var(--accent)", fontWeight: 600, cursor: "pointer" },
};
