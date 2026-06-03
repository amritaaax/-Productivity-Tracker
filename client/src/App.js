import React, { useEffect, useState, useCallback } from "react";
import "./App.css";
/* global chrome */

import {
  Pie, Bar, Line
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale,
  BarElement, PointElement, LineElement, Title,
} from "chart.js";

ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale,
  BarElement, PointElement, LineElement, Title
);

const API = "http://localhost:5000/api";

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function ScoreRing({ score }) {
  const color =
    score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="score-ring-wrap">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={color} strokeWidth="12"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="score-label">
        <span className="score-num" style={{ color }}>{score}</span>
        <span className="score-sub">/100</span>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card" style={{ borderTop: `4px solid ${color}` }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function BadgeCard({ badge }) {
  const badges = {
    "3_day_streak": { icon: "🔥", label: "3-Day Streak", desc: "3 days productive" },
    "7_day_streak": { icon: "⚡", label: "Week Warrior", desc: "7 days productive" },
    "30_day_streak": { icon: "🏆", label: "Legend", desc: "30 days productive" },
  };
  const b = badges[badge] || { icon: "🎖️", label: badge, desc: "" };
  return (
    <div className="badge-card">
      <div className="badge-icon">{b.icon}</div>
      <div className="badge-label">{b.label}</div>
      <div className="badge-desc">{b.desc}</div>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [focusMode, setFocusMode] = useState(false);
  const [streak, setStreak] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [error, setError] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch(`${API}/analytics`)
      .then((r) => r.json())
      .then((data) => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Cannot connect to server. Make sure backend is running.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Load chrome storage data if in extension context
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["focusMode", "streak", "achievements"], (result) => {
        setFocusMode(result.focusMode || false);
        setStreak(result.streak || 0);
        setAchievements(result.achievements || []);
      });
    }
  }, []);

  const toggleFocusMode = () => {
    const next = !focusMode;
    setFocusMode(next);
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ focusMode: next });
    }
  };

  if (loading) {
    return (
      <div className={`app ${theme}`}>
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading your productivity data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`app ${theme}`}>
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button className="btn-primary" onClick={fetchData}>Retry</button>
        </div>
      </div>
    );
  }

  const t = analytics?.today || {};
  const w = analytics?.weekly || {};

  // Chart colors
  const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];

  const pieData = {
    labels: (t.top5 || []).map((s) => s.site),
    datasets: [{
      data: (t.top5 || []).map((s) => Math.round(s.time / 1000 / 60)),
      backgroundColor: COLORS,
      borderWidth: 2,
      borderColor: theme === "dark" ? "#1e1e2e" : "#fff",
    }],
  };

  const prodVsDistData = {
    labels: ["Productive", "Distracting", "Neutral"],
    datasets: [{
      data: [
        Math.round((t.productiveTime || 0) / 1000 / 60),
        Math.round((t.distractingTime || 0) / 1000 / 60),
        Math.round((t.neutralTime || 0) / 1000 / 60),
      ],
      backgroundColor: ["#22c55e", "#ef4444", "#94a3b8"],
      borderWidth: 0,
    }],
  };

  const weeklyTrend = w.trend || {};
  const trendLabels = Object.keys(weeklyTrend).sort();
  const weeklyLineData = {
    labels: trendLabels,
    datasets: [
      {
        label: "Productive (min)",
        data: trendLabels.map((d) => Math.round((weeklyTrend[d]?.productive || 0) / 1000 / 60)),
        borderColor: "#22c55e",
        backgroundColor: "rgba(34,197,94,0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Distracting (min)",
        data: trendLabels.map((d) => Math.round((weeklyTrend[d]?.distracting || 0) / 1000 / 60)),
        borderColor: "#ef4444",
        backgroundColor: "rgba(239,68,68,0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOpts = {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: theme === "dark" ? "#e2e8f0" : "#1e293b", font: { size: 12 } },
      },
    },
    scales: {
      x: { ticks: { color: theme === "dark" ? "#94a3b8" : "#64748b" }, grid: { color: "rgba(148,163,184,0.1)" } },
      y: { ticks: { color: theme === "dark" ? "#94a3b8" : "#64748b" }, grid: { color: "rgba(148,163,184,0.1)" } },
    },
  };

  const pieOpts = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: theme === "dark" ? "#e2e8f0" : "#1e293b", font: { size: 11 }, padding: 12 },
      },
    },
  };

  const scoreLevel =
    t.score >= 80 ? { label: "Excellent 🚀", color: "#22c55e" }
    : t.score >= 60 ? { label: "Good 👍", color: "#6366f1" }
    : t.score >= 40 ? { label: "Average ⚡", color: "#f59e0b" }
    : { label: "Needs Work 📉", color: "#ef4444" };

  return (
    <div className={`app ${theme}`}>
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <span className="logo">📊</span>
          <div>
            <h1>Productivity Tracker</h1>
            <span className="subtitle">Internship Project Dashboard</span>
          </div>
        </div>
        <div className="header-right">
          <button
            className={`focus-btn ${focusMode ? "active" : ""}`}
            onClick={toggleFocusMode}
          >
            {focusMode ? "🎯 Focus ON" : "💤 Focus OFF"}
          </button>
          <button className="theme-btn" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button className="refresh-btn" onClick={fetchData}>🔄</button>
        </div>
      </header>

      {/* Streak + Achievements */}
      {(streak > 0 || achievements.length > 0) && (
        <div className="streak-bar">
          {streak > 0 && (
            <span className="streak-badge">🔥 {streak}-Day Streak</span>
          )}
          {achievements.map((a) => (
            <BadgeCard key={a} badge={a} />
          ))}
        </div>
      )}

      {/* Tabs */}
      <nav className="tabs">
        {["dashboard", "weekly", "insights"].map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "dashboard" ? "📊 Dashboard"
              : tab === "weekly" ? "📅 Weekly"
              : "💡 Insights"}
          </button>
        ))}
      </nav>

      <main className="main">
        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <>
            {/* Score + Stats */}
            <div className="top-section">
              <div className="score-card">
                <h3>Productivity Score</h3>
                <ScoreRing score={t.score || 0} />
                <div className="score-level" style={{ color: scoreLevel.color }}>
                  {scoreLevel.label}
                </div>
                <div className="focus-status">
                  Focus Mode: <strong style={{ color: focusMode ? "#22c55e" : "#ef4444" }}>
                    {focusMode ? "ON" : "OFF"}
                  </strong>
                </div>
              </div>
              <div className="stats-grid">
                <StatCard icon="⏱️" label="Total Time" value={formatTime(t.totalTime || 0)} color="#6366f1" />
                <StatCard icon="✅" label="Productive" value={formatTime(t.productiveTime || 0)} color="#22c55e" />
                <StatCard icon="⚠️" label="Distracting" value={formatTime(t.distractingTime || 0)} color="#ef4444" />
                <StatCard icon="📈" label="Neutral" value={formatTime(t.neutralTime || 0)} color="#94a3b8" />
                {t.mostProductive && (
                  <StatCard icon="🏆" label="Most Productive" value={t.mostProductive.site} color="#22c55e" />
                )}
                {t.mostDistracting && (
                  <StatCard icon="🚨" label="Most Distracting" value={t.mostDistracting.site} color="#ef4444" />
                )}
              </div>
            </div>

            {/* Overused Sites */}
            {(t.overused || []).length > 0 && (
              <div className="overused-banner">
                🚨 <strong>Overused today:</strong>{" "}
                {t.overused.map((o) => (
                  <span key={o.site} className="overused-pill">{o.site} ({formatTime(o.time)})</span>
                ))}
              </div>
            )}

            {/* Charts */}
            <div className="charts-grid">
              <div className="chart-card">
                <h3>⏱️ Today's Usage (Top 5)</h3>
                <Pie data={pieData} options={pieOpts} />
              </div>
              <div className="chart-card">
                <h3>🎯 Productive vs Distracting</h3>
                <Pie data={prodVsDistData} options={pieOpts} />
              </div>
            </div>

            {/* Top 5 Table */}
            <div className="table-card">
              <h3>🌐 Top Sites Today</h3>
              <table className="site-table">
                <thead>
                  <tr>
                    <th>#</th><th>Site</th><th>Time</th><th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {(t.top5 || []).map((s, i) => (
                    <tr key={s.site}>
                      <td>{i + 1}</td>
                      <td>{s.site}</td>
                      <td>{formatTime(s.time)}</td>
                      <td>
                        <span className={`type-badge type-${s.type}`}>
                          {s.type === "productive" ? "✅" : s.type === "distracting" ? "⚠️" : "➖"} {s.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* WEEKLY TAB */}
        {activeTab === "weekly" && (
          <>
            <div className="chart-card full-width">
              <h3>📅 Weekly Productivity Trend</h3>
              <Line data={weeklyLineData} options={chartOpts} />
            </div>
            <div className="table-card">
              <h3>🌐 Weekly Top Sites</h3>
              <table className="site-table">
                <thead>
                  <tr><th>Site</th><th>Total Time</th><th>Type</th></tr>
                </thead>
                <tbody>
                  {Object.entries(w.sites || {})
                    .sort((a, b) => b[1].time - a[1].time)
                    .slice(0, 10)
                    .map(([site, val]) => (
                      <tr key={site}>
                        <td>{site}</td>
                        <td>{formatTime(val.time)}</td>
                        <td>
                          <span className={`type-badge type-${val.type}`}>
                            {val.type === "productive" ? "✅" : val.type === "distracting" ? "⚠️" : "➖"} {val.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* INSIGHTS TAB */}
        {activeTab === "insights" && (
          <>
            <div className="insights-card">
              <h3>💡 Daily Insights</h3>
              {(t.insights || []).length === 0 ? (
                <p className="no-data">No insights yet. Browse more to generate insights.</p>
              ) : (
                (t.insights || []).map((ins, i) => (
                  <div key={i} className="insight-item">{ins}</div>
                ))
              )}
            </div>

            <div className="reco-card">
              <h3>🤖 Smart Recommendations</h3>
              {(t.score || 0) < 50 && (
                <div className="reco-item">📌 Enable Focus Mode to block distracting sites.</div>
              )}
              {(t.distractingTime || 0) > 2 * 60 * 60 * 1000 && (
                <div className="reco-item">⏰ You exceeded 2 hours on distracting sites. Take a break and refocus.</div>
              )}
              {(t.productiveTime || 0) >= 3 * 60 * 60 * 1000 && (
                <div className="reco-item">🎉 Amazing! 3+ hours productive. Keep the momentum!</div>
              )}
              {(t.totalTime || 0) === 0 && (
                <div className="reco-item">👋 No data yet. Start browsing and we'll track your productivity!</div>
              )}
              <div className="reco-item">💡 Use LeetCode or GitHub daily to maintain your streak.</div>
            </div>

            <div className="achievements-card">
              <h3>🏆 Achievements</h3>
              {achievements.length === 0 ? (
                <p className="no-data">No achievements yet. Stay productive to earn badges!</p>
              ) : (
                <div className="badges-grid">
                  {achievements.map((a) => <BadgeCard key={a} badge={a} />)}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <footer className="footer">
        <span>Productivity Tracker • Built with MERN + Chrome Extension</span>
        <span>Last updated: {new Date().toLocaleTimeString()}</span>
      </footer>
    </div>
  );
}