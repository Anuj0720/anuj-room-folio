import React, { useState, useEffect } from "react";

function formatStatKey(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/([0-9]+)/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

const heroFont = { fontFamily: "var(--font-bitcount)" };

const STAT_META = {
  appearances: { icon: "🎽" },
  goals:       { icon: "⚽" },
  assists:     { icon: "🎯" },
  trophies:    { icon: "🏆" },
  ballonDor:   { icon: "⭐" },
  cleanSheets: { icon: "🧤" },
  matches:     { icon: "📊" },
};

function getMeta(key) {
  const lower = key.charAt(0).toLowerCase() + key.slice(1);
  return STAT_META[lower] || { icon: "📈" };
}

const TABS = ["Stats", "Career", "Teams"];

export default function Drawer({ open, player, onClose }) {
  const [activeTab, setActiveTab] = useState("Stats");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveTab("Stats");
  }, [player?.name]);

  const statEntries = player ? Object.entries(player.stats) : [];
  const gridStats = statEntries.slice(0, 4);
  const rowStats  = statEntries.slice(4);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <aside
        style={{ width: "min(560px, 100vw)" }}
        className={`fixed top-0 right-0 z-50 flex h-full flex-col overflow-hidden shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {player ? (
          <div className="flex h-full flex-col overflow-hidden" style={{ background: "#0e0a08" }}>

            {/* ── HERO IMAGE HEADER (original design) ── */}
            <div className="relative flex-shrink-0 w-full" style={{ height: 380 }}>
              <img
                src={player.image}
                alt={player.name}
                className="absolute inset-0 h-full w-full object-cover object-top"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #0e0a08 0%, rgba(10,6,4,0.6) 50%, transparent 100%)" }} />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full"
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 13,
                  cursor: "pointer",
                  backdropFilter: "blur(8px)",
                }}
                aria-label="Close"
              >
                ✕
              </button>

              {/* Name overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0" style={{ padding: "0 24px 20px" }}>
                <p
                  style={{ ...heroFont, fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "#38bdf8", marginBottom: 6 }}
                >
                  Football Legend
                </p>
                <h2
                  style={{ ...heroFont, fontSize: 34, fontWeight: 800, color: "#fff", lineHeight: 1.1, letterSpacing: "0.06em" }}
                >
                  {player.name}
                </h2>
              </div>
            </div>

            {/* ── TABS ── */}
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                padding: "0 24px",
                flexShrink: 0,
                background: "#0e0a08",
              }}
            >
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    paddingTop: 14,
                    paddingBottom: 14,
                    paddingRight: 28,
                    paddingLeft: 0,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    background: "none",
                    border: "none",
                    borderBottom: activeTab === tab ? "2px solid #38bdf8" : "2px solid transparent",
                    color: activeTab === tab ? "#38bdf8" : "rgba(255,255,255,0.28)",
                    cursor: "pointer",
                    marginBottom: -1,
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* ── SCROLLABLE CONTENT ── */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: 20,
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(255,255,255,0.08) transparent",
              }}
            >

              {/* ── STATS TAB ── */}
              {activeTab === "Stats" && (
                <>
                  {/* Age + Trophies */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[
                      { label: "Age",      value: player.age },
                      { label: "Trophies", value: player.stats.trophies ?? "—" },
                    ].map(({ label, value }) => (
                      <div key={label} style={cardStyle}>
                        <p style={labelStyle}>{label}</p>
                        <p style={bigNumStyle}>{value}</p>
                      </div>
                    ))}
                  </div>

                  <p style={sectionLabelStyle}>Career Statistics</p>

                  {/* 2×2 stat grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {gridStats.map(([key, value]) => {
                      const { icon } = getMeta(key);
                      return (
                        <div key={key} style={cardStyle}>
                          <span style={{ fontSize: 22, marginBottom: 14, display: "block" }}>{icon}</span>
                          <p style={{ ...bigNumStyle, fontSize: 38 }}>{value}</p>
                          <p style={{ ...labelStyle, marginTop: 8 }}>{formatStatKey(key)}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Extra stat rows */}
                  {rowStats.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {rowStats.map(([key, value]) => {
                        const { icon } = getMeta(key);
                        return (
                          <div key={key} style={{ ...cardStyle, flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: "16px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                                {icon}
                              </div>
                              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
                                {formatStatKey(key)}
                              </p>
                            </div>
                            <p style={{ fontSize: 30, fontWeight: 700, color: "#fff" }}>{value}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* ── CAREER TAB ── */}
              {activeTab === "Career" && (
                <>
                  <p style={sectionLabelStyle}>Career Story</p>
                  <div style={{ ...cardStyle, gap: 16 }}>
                    {player.description.map((line, i) => (
                      <p key={i} style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,0.55)" }}>
                        {line}
                      </p>
                    ))}
                  </div>
                </>
              )}

              {/* ── TEAMS TAB ── */}
              {activeTab === "Teams" && (
                <>
                  <p style={sectionLabelStyle}>{player.teams.length} Teams</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {player.teams.map((team) => (
                      <div key={team.name} style={{ ...cardStyle, flexDirection: "row", alignItems: "center", gap: 14, padding: "14px 16px" }}>
                        <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 10, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", padding: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <img src={team.logo} alt={team.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {team.name}
                          </p>
                          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginTop: 3 }}>
                            Club
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

            </div>
          </div>
        ) : (
          /* Empty state */
          <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#0e0a08" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "20px 24px" }}>
              <button
                onClick={onClose}
                style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 32px", textAlign: "center" }}>
              <div>
                <p style={{ fontSize: 17, fontWeight: 600, color: "#fff" }}>Select a Player</p>
                <p style={{ marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.7 }}>
                  Open a profile to view career statistics, history, and achievements.
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

/* ── Shared style tokens ── */
const cardStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 14,
  padding: "20px 22px",
  display: "flex",
  flexDirection: "column",
};

const bigNumStyle = {
  fontSize: 42,
  fontWeight: 700,
  color: "#ffffff",
  lineHeight: 1,
  letterSpacing: "-0.02em",
};

const labelStyle = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.35)",
};

const sectionLabelStyle = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.3)",
  marginBottom: -8,
};