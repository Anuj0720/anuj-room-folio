import { useState, useEffect } from "react";
import { useLivePlayer, loadRonaldoLiveStats } from "../../helper/liveStats";

function formatStatKey(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/([0-9]+)/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

const heroFont = { fontFamily: "var(--font-bitcount)" };

const STAT_META = {
  appearances: { icon: "/icons/apperance.svg" },
  goals:       { icon: "/icons/goals.svg" },
  assists:     { icon: "/icons/assists.svg" },
  trophies:    { icon: "/icons/trophy.svg" },
  ballonDor:   { icon: "/icons/ballonDor.svg" },
  cleanSheets: { icon: "/icons/cleanSheets.svg" },
  matches:     { icon: "/icons/matches.svg" },
};

function getMeta(key) {
  const k = key.charAt(0).toLowerCase() + key.slice(1);
  return STAT_META[k] || { icon: "/icons/ballonDor.svg" };
}

const TABS = ["Stats", "Career", "Teams"];

// Tiny pulsing dot shown next to values that are fetched live.
function LiveDot({ title = "Live" }) {
  return (
    <span
      title={title}
      aria-label={title}
      className="live-dot"
      style={{
        display: "inline-block",
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: "#34d399",
        marginLeft: 8,
        verticalAlign: "middle",
        boxShadow: "0 0 0 0 rgba(52,211,153,0.6)",
        animation: "livePulse 1.8s ease-out infinite",
      }}
    />
  );
}

// ─── NIGHT theme (unchanged) ─────────────────────────────────────────────────
const NIGHT = {
  bg:             "#07090f",
  panelBg:        "#0b0f1a",
  cardBg:         "rgba(120,160,255,0.05)",
  cardBorder:     "rgba(120,160,255,0.10)",
  cardShadow:     "none",
  accent:         "#7eb8f7",
  tabActive:      "#7eb8f7",
  tabInactive:    "rgba(255,255,255,0.22)",
  tabBorder:      "1px solid rgba(120,160,255,0.10)",
  text:           "#e8f0ff",
  textMuted:      "rgba(180,200,255,0.45)",
  textFaint:      "rgba(180,200,255,0.28)",
  heroOverlay:    "linear-gradient(to top, #07090f 0%, rgba(7,9,15,0.70) 42%, rgba(7,9,15,0.0) 80%)",
  heroFilter:     "brightness(0.75) saturate(0.8)",
  heroExtraShine: "radial-gradient(ellipse at 80% 10%, rgba(126,184,247,0.08) 0%, transparent 60%)",
  iconFilter:     "brightness(0) saturate(100%) invert(72%) sepia(40%) saturate(500%) hue-rotate(190deg)",
  closeBtn:       "rgba(120,160,255,0.12)",
  closeBtnBorder: "rgba(120,160,255,0.15)",
  closeBtnColor:  "rgba(180,200,255,0.6)",
  scrollbar:      "rgba(120,160,255,0.12)",
  sectionLabel:   "rgba(140,180,255,0.35)",
  statIconBg:     "rgba(120,160,255,0.08)",
  statIconBorder: "rgba(120,160,255,0.12)",
  teamLogoBg:     "rgba(120,160,255,0.06)",
  teamLogoBorder: "rgba(120,160,255,0.10)",
  eyebrow:        "#7eb8f7",
  backdrop:       "rgba(0,5,20,0.55)",
};

// ─── DAY theme — warm sand base, clearly visible text + cards ────────────────
// bg:      #e8ddd0  (warm sand )
// panelBg: same
// cardBg:  #f5ede2  (slightly lighter warm cream )
// text:    #1a0f00  (near-black warm brown)
const DAY = {
  bg:             "#e8ddd0",
  panelBg:        "#e8ddd0",
  cardBg:         "#f5ede2",
  cardBorder:     "rgba(160,100,20,0.20)",
  cardShadow:     "0 2px 10px rgba(120,70,0,0.10)",
  accent:         "#c46800",
  tabActive:      "#c46800",
  tabInactive:    "rgba(26,15,0,0.38)",
  tabBorder:      "1px solid rgba(160,100,20,0.22)",
  text:           "#1a0f00",
  textMuted:      "rgba(26,15,0,0.55)",
  textFaint:      "rgba(26,15,0,0.38)",
  // gradient colour-matched to new bg so bottom seam is seamless
  heroOverlay:    "linear-gradient(to top, rgba(232,221,208,1) 0%, rgba(232,221,208,0.88) 10%, rgba(232,221,208,0.4) 22%, rgba(232,221,208,0.0) 36%)",
  heroFilter:     "none",
  heroExtraShine: null,
  iconFilter:     "brightness(0) saturate(100%) invert(36%) sepia(80%) saturate(600%) hue-rotate(18deg) brightness(0.82)",
  closeBtn:       "rgba(232,221,208,0.85)",
  closeBtnBorder: "rgba(26,15,0,0.18)",
  closeBtnColor:  "rgba(26,15,0,0.65)",
  scrollbar:      "rgba(160,100,20,0.25)",
  sectionLabel:   "rgba(26,15,0,0.38)",
  statIconBg:     "rgba(196,104,0,0.10)",
  statIconBorder: "rgba(196,104,0,0.20)",
  teamLogoBg:     "#f5ede2",
  teamLogoBorder: "rgba(160,100,20,0.20)",
  eyebrow:        "#c46800",
  backdrop:       "rgba(0,0,0,0.30)",
};

function getTheme(isNight) { return isNight ? NIGHT : DAY; }

// ─── Component ────────────────────────────────────────────────────────────────

export default function Drawer({ open, player: basePlayer, onClose, isNight = false }) {
  const [activeTab, setActiveTab] = useState("Stats");
  // Live values for flagged players (Ronaldo only); others pass through.
  const { player, liveKeys, status: liveStatus, updatedAt } = useLivePlayer(basePlayer);
  const t = getTheme(isNight);

  useEffect(() => { setActiveTab("Stats"); }, [player?.name]);

  // Re-check for fresh stats whenever a live player's drawer opens
  // (no-op if the cached copy is still fresh).
  useEffect(() => {
    if (open && basePlayer?.liveSource) loadRonaldoLiveStats();
  }, [open, basePlayer?.liveSource]);

  const isLive = (key) => liveKeys.includes(key);

  const statEntries = player ? Object.entries(player.stats) : [];
  const gridStats   = statEntries.slice(0, 4);
  const rowStats    = statEntries.slice(4);

  const card = {
    background:    t.cardBg,
    border:        `1px solid ${t.cardBorder}`,
    borderRadius:  16,
    padding:       "20px 22px",
    display:       "flex",
    flexDirection: "column",
    boxShadow:     t.cardShadow,
    transition:    "background 0.4s ease, border 0.4s ease, box-shadow 0.4s ease",
  };

  const bigNum = {
    fontSize:      42,
    fontWeight:    700,
    color:         t.text,
    lineHeight:    1,
    letterSpacing: "-0.02em",
    transition:    "color 0.4s ease",
  };

  const lbl = {
    fontSize:      10,
    fontWeight:    600,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color:         t.textFaint,
    transition:    "color 0.4s ease",
  };

  const sectionLbl = {
    fontSize:      10,
    fontWeight:    600,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color:         t.sectionLabel,
    marginBottom:  -8,
    transition:    "color 0.4s ease",
  };

  return (
    <>
      <style>{`
        @keyframes livePulse {
          0%   { box-shadow: 0 0 0 0 rgba(52,211,153,0.55); }
          70%  { box-shadow: 0 0 0 7px rgba(52,211,153,0); }
          100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); }
        }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        onClick={onClose}
        style={{
          position:      "fixed",
          inset:         0,
          zIndex:        40,
          background:    t.backdrop,
          opacity:       open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition:    "opacity 0.3s ease, background 0.4s ease",
        }}
      />

      {/* ── Panel ── */}
      <aside
        style={{
          position:      "fixed",
          top:           0,
          right:         0,
          zIndex:        50,
          width:         "min(560px, 100vw)",
          height:        "100%",
          display:       "flex",
          flexDirection: "column",
          overflow:      "hidden",
          boxShadow:     "0 0 48px rgba(0,0,0,0.28)",
          transform:     open ? "translateX(0)" : "translateX(100%)",
          transition:    "transform 0.32s ease",
        }}
      >
        {player ? (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: t.bg, transition: "background 0.4s ease" }}>

            {/* ── HERO ── */}
            <div style={{ position: "relative", flexShrink: 0, width: "100%", height: 370 }}>
              <img
                src={player.image}
                alt={player.name}
                style={{
                  position:       "absolute",
                  inset:          0,
                  width:          "100%",
                  height:         "100%",
                  objectFit:      "cover",
                  objectPosition: "center top",
                  filter:         t.heroFilter,
                  transition:     "filter 0.5s ease",
                }}
              />

              {/* Bottom gradient — colour-matched to panel bg */}
              <div style={{ position: "absolute", inset: 0, background: t.heroOverlay, transition: "background 0.5s ease" }} />

              {/* Night shimmer */}
              {isNight && t.heroExtraShine && (
                <div style={{ position: "absolute", inset: 0, background: t.heroExtraShine, pointerEvents: "none" }} />
              )}

              {/* Close */}
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  position:             "absolute",
                  top:                  16,
                  right:                16,
                  width:                36,
                  height:               36,
                  borderRadius:         "50%",
                  border:               `1px solid ${t.closeBtnBorder}`,
                  background:           t.closeBtn,
                  color:                t.closeBtnColor,
                  fontSize:             14,
                  cursor:               "pointer",
                  display:              "flex",
                  alignItems:           "center",
                  justifyContent:       "center",
                  backdropFilter:       "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  transition:           "background 0.4s ease",
                }}
              >✕</button>

              {/* Name */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 24px 22px" }}>
                <p style={{ ...heroFont, fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: t.eyebrow, marginBottom: 6, transition: "color 0.4s ease" }}>
                  Football Legend
                </p>
                <h2 style={{ ...heroFont, fontSize: 34, fontWeight: 800, color: t.text, lineHeight: 1.1, letterSpacing: "0.06em", transition: "color 0.4s ease" }}>
                  {player.name}
                </h2>
              </div>
            </div>

            {/* ── TABS ── */}
            <div style={{ display: "flex", borderBottom: t.tabBorder, padding: "0 24px", flexShrink: 0, background: t.panelBg, transition: "background 0.4s ease" }}>
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    paddingTop:    14,
                    paddingBottom: 14,
                    paddingRight:  28,
                    paddingLeft:   0,
                    fontSize:      11,
                    fontWeight:    600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    background:    "none",
                    border:        "none",
                    borderBottom:  activeTab === tab ? `2px solid ${t.accent}` : "2px solid transparent",
                    color:         activeTab === tab ? t.tabActive : t.tabInactive,
                    cursor:        "pointer",
                    marginBottom:  -1,
                    transition:    "color 0.3s ease, border-bottom 0.3s ease",
                  }}
                >{tab}</button>
              ))}
            </div>

            {/* ── SCROLLABLE BODY ── */}
            <div
              style={{
                flex:           1,
                overflowY:      "auto",
                padding:        "24px",
                display:        "flex",
                flexDirection:  "column",
                gap:            20,
                scrollbarWidth: "thin",
                scrollbarColor: `${t.scrollbar} transparent`,
                background:     t.bg,
                transition:     "background 0.4s ease",
              }}
            >
              {/* STATS */}
              {activeTab === "Stats" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[{ label: "Age", value: player.age, live: Boolean(player.dob) }, { label: "Trophies", value: player.stats.trophies ?? "—", live: isLive("trophies") }].map(({ label: l, value, live }) => (
                      <div key={l} style={card}>
                        <p style={lbl}>{l}{live && <LiveDot />}</p>
                        <p style={bigNum}>{value}</p>
                      </div>
                    ))}
                  </div>

                  <p style={sectionLbl}>Career Statistics</p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {gridStats.map(([key, value]) => {
                      const { icon } = getMeta(key);
                      return (
                        <div key={key} style={card}>
                          <img src={icon} alt={formatStatKey(key)} style={{ width: 28, height: 28, marginBottom: 14, objectFit: "contain", filter: t.iconFilter, transition: "filter 0.4s ease" }} />
                          <p style={{ ...bigNum, fontSize: 38 }}>{value}</p>
                          <p style={{ ...lbl, marginTop: 8 }}>{formatStatKey(key)}{isLive(key) && <LiveDot />}</p>
                        </div>
                      );
                    })}
                  </div>

                  {rowStats.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {rowStats.map(([key, value]) => {
                        const { icon } = getMeta(key);
                        return (
                          <div key={key} style={{ ...card, flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: "16px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                              <div style={{ width: 40, height: 40, borderRadius: 10, background: t.statIconBg, border: `1px solid ${t.statIconBorder}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.4s ease" }}>
                                <img src={icon} alt={formatStatKey(key)} style={{ width: 22, height: 22, objectFit: "contain", filter: t.iconFilter, transition: "filter 0.4s ease" }} />
                              </div>
                              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: t.textMuted, transition: "color 0.4s ease" }}>
                                {formatStatKey(key)}{isLive(key) && <LiveDot />}
                              </p>
                            </div>
                            <p style={{ fontSize: 30, fontWeight: 700, color: t.text, transition: "color 0.4s ease" }}>{value}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {basePlayer?.liveSource && (
                    <p style={{ fontSize: 11, lineHeight: 1.6, color: t.textFaint, transition: "color 0.4s ease" }}>
                      {liveKeys.length > 0 ? (
                        <>
                          <LiveDot title="Live" />
                          Updated live from Wikipedia
                          {updatedAt ? ` · ${new Date(updatedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}` : ""}.
                          {" "}Assists are not live.
                        </>
                      ) : liveStatus === "fallback" ? (
                        "Couldn’t reach the live source — showing saved stats."
                      ) : (
                        "Checking for the latest stats…"
                      )}
                    </p>
                  )}
                </>
              )}

              {/* CAREER */}
              {activeTab === "Career" && (
                <>
                  <p style={sectionLbl}>Career Story</p>
                  <div style={{ ...card, gap: 16 }}>
                    {player.description.map((line, i) => (
                      <p key={i} style={{ fontSize: 14, lineHeight: 1.8, color: t.textMuted, transition: "color 0.4s ease" }}>{line}</p>
                    ))}
                  </div>
                </>
              )}

              {/* TEAMS */}
              {activeTab === "Teams" && (
                <>
                  <p style={sectionLbl}>{player.teams.length} Teams</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {player.teams.map((team) => (
                      <div key={team.name} style={{ ...card, flexDirection: "row", alignItems: "center", gap: 14, padding: "14px 16px" }}>
                        <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 10, background: t.teamLogoBg, border: `1px solid ${t.teamLogoBorder}`, padding: 8, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.4s ease" }}>
                          <img src={team.logo} alt={team.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", transition: "color 0.4s ease" }}>{team.name}</p>
                          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: t.textFaint, marginTop: 3, transition: "color 0.4s ease" }}>Club</p>
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
          <div style={{ display: "flex", flexDirection: "column", height: "100%", background: t.bg, transition: "background 0.4s ease" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "20px 24px" }}>
              <button onClick={onClose} aria-label="Close" style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${t.closeBtnBorder}`, background: t.closeBtn, color: t.closeBtnColor, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.4s ease" }}>✕</button>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 32px", textAlign: "center" }}>
              <div>
                <p style={{ fontSize: 17, fontWeight: 600, color: t.text, transition: "color 0.4s ease" }}>Select a Player</p>
                <p style={{ marginTop: 8, fontSize: 13, color: t.textMuted, lineHeight: 1.7, transition: "color 0.4s ease" }}>Open a profile to view career statistics, history, and achievements.</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
