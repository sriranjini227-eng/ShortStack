import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import {
  BarChart3,
  CalendarClock,
  Clipboard,
  ExternalLink,
  Pencil,
  Link2,
  LogOut,
  MousePointerClick,
  QrCode,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wand2
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { api, clearToken, getToken, setToken } from "./api";

function formatDate(value) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function useAuth() {
  const [token, setAuthToken] = useState(getToken());
  const login = (newToken) => {
    setToken(newToken);
    setAuthToken(newToken);
  };
  const logout = () => {
    clearToken();
    setAuthToken(null);
  };
  return { token, login, logout };
}

function Protected({ token, children }) {
  return token ? children : <Navigate to="/login" replace />;
}

function Shell({ auth, children }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark"><Link2 size={20} /></span>
          <span>
            ShortStack
            <small>URL intelligence</small>
          </span>
        </Link>
        {auth.token && (
          <button className="ghost-button" onClick={auth.logout}>
            <LogOut size={18} />
            Sign out
          </button>
        )}
      </header>
      {children}
    </div>
  );
}

function AuthPage({ mode, auth }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [status, setStatus] = useState({ loading: false, error: "" });
  const isSignup = mode === "signup";

  async function submit(event) {
    event.preventDefault();
    setStatus({ loading: true, error: "" });

    try {
      const data = await api(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(form)
      });
      auth.login(data.token);
      navigate("/", { replace: true });
    } catch (error) {
      setStatus({ loading: false, error: error.message });
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-panel">
        <div>
          <p className="eyebrow">URL analytics workspace</p>
          <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
          <p className="lede">Create memorable short links, watch every click, and keep your campaigns tidy.</p>
        </div>
        <form onSubmit={submit} className="form">
          {isSignup && (
            <label>
              Name
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                minLength={2}
                required
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              minLength={8}
              required
            />
          </label>
          {status.error && <p className="error">{status.error}</p>}
          <button className="primary-button" disabled={status.loading}>
            {status.loading ? "Working..." : isSignup ? "Sign up" : "Log in"}
          </button>
        </form>
        <p className="muted">
          {isSignup ? "Already have an account?" : "Need an account?"}{" "}
          <Link to={isSignup ? "/login" : "/signup"}>{isSignup ? "Log in" : "Sign up"}</Link>
        </p>
      </section>
      <section className="auth-art">
        <div className="art-ribbon">
          <Sparkles size={16} />
          Smart redirects
        </div>
        <div className="metric-tile">
          <BarChart3 size={26} />
          <strong>Live click tracking</strong>
          <span>Visits, recency, and daily performance in one dashboard.</span>
        </div>
      </section>
    </main>
  );
}

function Dashboard() {
  const [links, setLinks] = useState([]);
  const [form, setForm] = useState({ originalUrl: "", customAlias: "", expiresAt: "" });
  const [editing, setEditing] = useState({ id: "", originalUrl: "" });
  const [status, setStatus] = useState({ loading: true, saving: false, error: "", success: "" });

  async function loadLinks() {
    setStatus((current) => ({ ...current, loading: true, error: "" }));
    try {
      const data = await api("/links");
      setLinks(data.links);
      setStatus((current) => ({ ...current, loading: false }));
    } catch (error) {
      setStatus((current) => ({ ...current, loading: false, error: error.message }));
    }
  }

  useEffect(() => {
    loadLinks();
  }, []);

  async function createLink(event) {
    event.preventDefault();
    setStatus((current) => ({ ...current, saving: true, error: "", success: "" }));
    try {
      const payload = {
        originalUrl: form.originalUrl,
        customAlias: form.customAlias || undefined,
        expiresAt: form.expiresAt || undefined
      };
      const data = await api("/links", { method: "POST", body: JSON.stringify(payload) });
      setLinks([data.link, ...links]);
      setForm({ originalUrl: "", customAlias: "", expiresAt: "" });
      setStatus((current) => ({ ...current, saving: false, success: "Short URL created" }));
    } catch (error) {
      setStatus((current) => ({ ...current, saving: false, error: error.message }));
    }
  }

  async function deleteLink(id) {
    await api(`/links/${id}`, { method: "DELETE" });
    setLinks(links.filter((link) => link.id !== id));
  }

  async function updateLink(event) {
    event.preventDefault();
    setStatus((current) => ({ ...current, error: "", success: "" }));
    try {
      const data = await api(`/links/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify({ originalUrl: editing.originalUrl })
      });
      setLinks(links.map((link) => (link.id === editing.id ? data.link : link)));
      setEditing({ id: "", originalUrl: "" });
      setStatus((current) => ({ ...current, success: "Destination URL updated" }));
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.message }));
    }
  }

  const totals = useMemo(
    () => ({
      links: links.length,
      clicks: links.reduce((sum, link) => sum + link.clickCount, 0)
    }),
    [links]
  );

  return (
    <main className="dashboard">
      <section className="hero-band">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Short links with useful analytics</h1>
          <p className="lede">Generate links, share them confidently, and see performance as visits arrive.</p>
        </div>
        <div className="summary-grid">
          <div><Link2 size={20} /><span>{totals.links}</span><small>Links</small></div>
          <div><MousePointerClick size={20} /><span>{totals.clicks}</span><small>Total clicks</small></div>
        </div>
      </section>

      <section className="tool-grid">
        <form className="creator-panel" onSubmit={createLink}>
          <div className="panel-heading">
            <span><Wand2 size={18} /></span>
            <div>
              <h2>Create a short URL</h2>
              <p className="muted">Use an optional alias or expiry for campaign-ready links.</p>
            </div>
          </div>
          <label>
            Destination URL
            <input
              type="url"
              placeholder="https://example.com/long/path"
              value={form.originalUrl}
              onChange={(event) => setForm({ ...form, originalUrl: event.target.value })}
              required
            />
          </label>
          <div className="split-row">
            <label>
              Custom alias
              <input
                placeholder="launch"
                value={form.customAlias}
                onChange={(event) => setForm({ ...form, customAlias: event.target.value })}
                pattern="[a-zA-Z0-9_-]{3,32}"
              />
            </label>
            <label>
              Expiry date
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(event) => setForm({ ...form, expiresAt: event.target.value })}
              />
            </label>
          </div>
          {status.error && <p className="error">{status.error}</p>}
          {status.success && <p className="success">{status.success}</p>}
          <button className="primary-button" disabled={status.saving}>
            {status.saving ? "Creating..." : "Create short link"}
          </button>
        </form>

        <section className="list-panel">
          <div className="panel-heading compact">
            <span><ShieldCheck size={18} /></span>
            <div>
              <h2>Your links</h2>
              <p className="muted">Private to your account.</p>
            </div>
          </div>
          {status.loading ? (
            <p className="muted">Loading links...</p>
          ) : links.length === 0 ? (
            <p className="muted">No links yet. Create your first short URL.</p>
          ) : (
            <div className="link-list">
              {links.map((link) => (
                <article className="link-row" key={link.id}>
                  {editing.id === link.id ? (
                    <form className="edit-form" onSubmit={updateLink}>
                      <label>
                        Destination URL
                        <input
                          type="url"
                          value={editing.originalUrl}
                          onChange={(event) => setEditing({ ...editing, originalUrl: event.target.value })}
                          required
                        />
                      </label>
                      <div className="edit-actions">
                        <button className="primary-button small" type="submit">Save</button>
                        <button className="ghost-button small" type="button" onClick={() => setEditing({ id: "", originalUrl: "" })}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="link-main">
                      <a href={link.shortUrl} target="_blank" rel="noreferrer">{link.shortUrl}</a>
                      <span>{link.originalUrl}</span>
                    </div>
                  )}
                  <div className="link-meta">
                    <span><CalendarClock size={15} /> {formatDate(link.createdAt)}</span>
                    <span>{link.clickCount} clicks</span>
                  </div>
                  <div className="row-actions">
                    <button title="Copy short URL" onClick={() => navigator.clipboard.writeText(link.shortUrl)}>
                      <Clipboard size={17} />
                    </button>
                    <Link title="Analytics" to={`/links/${link.id}`}>
                      <BarChart3 size={17} />
                    </Link>
                    <button title="Edit destination URL" onClick={() => setEditing({ id: link.id, originalUrl: link.originalUrl })}>
                      <Pencil size={17} />
                    </button>
                    <button title="Delete" onClick={() => deleteLink(link.id)}>
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function Analytics() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/links/${id}`).then(setData).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <main className="dashboard"><p className="error">{error}</p></main>;
  if (!data) return <main className="dashboard"><p className="muted">Loading analytics...</p></main>;

  const maxClicks = Math.max(1, ...data.dailyClicks.map((day) => day.clicks));

  return (
    <main className="dashboard">
      <Link className="back-link" to="/">Back to dashboard</Link>
      <section className="analytics-head">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1>{data.link.code}</h1>
          <a href={data.link.shortUrl} target="_blank" rel="noreferrer">
            {data.link.shortUrl} <ExternalLink size={15} />
          </a>
        </div>
        <div className="qr-box">
          <QrCode size={18} />
          <QRCodeCanvas value={data.link.shortUrl} size={112} />
        </div>
      </section>

      <section className="stats-grid">
        <div><span>{data.link.clickCount}</span><small>Total clicks</small></div>
        <div><span>{formatDate(data.link.lastVisitedAt)}</span><small>Last visited</small></div>
        <div><span>{formatDate(data.link.createdAt)}</span><small>Created</small></div>
      </section>

      <section className="chart-panel">
        <h2>Daily clicks</h2>
        {data.dailyClicks.length === 0 ? (
          <p className="muted">Click trends will appear after the first visit.</p>
        ) : (
          <div className="bar-chart" aria-label="Daily click chart">
            {data.dailyClicks.map((day) => (
              <div className="bar-item" key={day.date}>
                <div className="bar-track">
                  <span style={{ height: `${Math.max(10, (day.clicks / maxClicks) * 100)}%` }} />
                </div>
                <strong>{day.clicks}</strong>
                <small>{day.date.slice(5)}</small>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="list-panel">
        <h2>Recent visits</h2>
        {data.visits.length === 0 ? (
          <p className="muted">No visits recorded yet.</p>
        ) : (
          <div className="visit-list">
            {data.visits.map((visit, index) => (
              <div className="visit-row" key={`${visit.visitedAt}-${index}`}>
                <strong>{formatDate(visit.visitedAt)}</strong>
                <span>{visit.referrer}</span>
                <small>{visit.userAgent}</small>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default function App() {
  const auth = useAuth();

  return (
    <Shell auth={auth}>
      <Routes>
        <Route path="/login" element={auth.token ? <Navigate to="/" /> : <AuthPage mode="login" auth={auth} />} />
        <Route path="/signup" element={auth.token ? <Navigate to="/" /> : <AuthPage mode="signup" auth={auth} />} />
        <Route path="/" element={<Protected token={auth.token}><Dashboard /></Protected>} />
        <Route path="/links/:id" element={<Protected token={auth.token}><Analytics /></Protected>} />
      </Routes>
    </Shell>
  );
}
