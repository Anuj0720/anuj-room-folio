import React from "react";

function formatStatKey(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/([0-9]+)/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

const heroFont = { fontFamily: "var(--font-bitcount)" };
const bodyFont = { fontFamily: "var(--font-roboto)" };

const STAT_META = {
  appearances: { icon: "🎽", color: "#38bdf8" }, // Sky
  goals: { icon: "⚽", color: "#34d399" }, // Emerald
  assists: { icon: "🎯", color: "#a78bfa" }, // Violet
  trophies: { icon: "🏆", color: "#fbbf24" }, // Amber
  ballonDor: { icon: "⭐", color: "#fbbf24" }, // Amber
  cleanSheets: { icon: "🧤", color: "#38bdf8" }, // Sky
  matches: { icon: "📊", color: "#38bdf8" }, // Sky
};

function getMeta(key) {
  const lower = key.charAt(0).toLowerCase() + key.slice(1);
  return STAT_META[lower] || { icon: "📈", color: "#94a3b8" };
}

export default function Drawer({ open, player, onClose }) {
  const statEntries = player ? Object.entries(player.stats) : [];

  // Split: first 4 stats in hero grid, rest as list
  const heroStats = statEntries.slice(0, 4);
  const extraStats = statEntries.slice(4);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <aside
        className={`fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col overflow-hidden bg-[#0a0f1c] text-white shadow-2xl ring-1 ring-white/10 transition-transform duration-300 ease-in-out md:w-[420px] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {player ? (
          <div className="flex h-full flex-col overflow-hidden">
            {/* ── HERO IMAGE ── */}
            <div className="relative flex-shrink-0 w-full h-[380px]">
              <img
                src={player.image}
                alt={player.name}
                className="absolute inset-0 h-full w-full object-cover object-top"
              />

              {/* Refined Smooth Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1c] via-[#0a0f1c]/70 to-transparent" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 border border-white/10 text-sm font-semibold text-white/70 backdrop-blur-md transition-all hover:bg-black/60 hover:text-white cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>

              {/* Player name overlay */}
              <div className="absolute bottom-0 left-0 right-0 px-6 pb-4">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.3em] text-sky-400"
                  style={heroFont}
                >
                  Football Legend
                </p>
                <h2
                  className="mt-1 text-3xl font-extrabold leading-tight text-white"
                  style={{ ...heroFont, letterSpacing: "0.08em" }}
                >
                  {player.name}
                </h2>
              </div>
            </div>

            {/* ── SCROLLABLE CONTENT ── */}
            <div
              className="flex-1 overflow-y-auto p-6  pb-10 drawer-scrollbar"
              style={bodyFont}
            >
              <div className="flex flex-col gap-10">
                {/* ── AGE & TROPHIES (Top Row) ── */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Age", value: player.age },
                    {
                      label: "Total Trophies",
                      value: player.stats.trophies ?? "—",
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex flex-col justify-center rounded-2xl border border-white/5 bg-white/[0.03] p-5"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        {label}
                      </p>
                      <p className="mt-1 text-3xl font-extrabold text-white">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* ── QUICK STATS ── */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      Career Statistics
                    </p>
                    <span className="rounded bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-300">
                      Elite
                    </span>
                  </div>

                  {/* 2x2 Hero Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-12">
                    {heroStats.map(([key, value]) => {
                      const { icon, color } = getMeta(key);
                      return (
                        <div
                          key={key}
                          className="flex flex-col rounded-xl border border-white/5 bg-white/[0.04] p-5"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-7 w-7 items-center justify-center rounded bg-opacity-20 text-xs"
                              style={{ backgroundColor: `${color}20` }}
                            >
                              {icon}
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {formatStatKey(key)}
                            </p>
                          </div>
                          <p className="mt-4 text-3xl font-bold text-white tracking-tight">
                            {value}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* List Stats (Ballon d'Or, etc.) */}
                  {extraStats.length > 0 && (
                    <div className="flex flex-col gap-4 ">
                      {extraStats.map(([key, value]) => {
                        const { icon, color } = getMeta(key);
                        return (
                          <div
                            key={key}
                            className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.04] px-5 py-4"
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className="flex h-10 w-10 items-center justify-center rounded-lg bg-opacity-20"
                                style={{ backgroundColor: `${color}20` }}
                              >
                                <span className="text-base">{icon}</span>
                              </div>
                              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300">
                                {formatStatKey(key)}
                              </p>
                            </div>
                            <p className="text-2xl font-bold text-white">
                              {value}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── CAREER STORY ── */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">
                    Career Story
                  </p>
                  <div className="space-y-4">
                    {player.description.map((line, i) => (
                      <p
                        key={i}
                        className="text-[13px] leading-relaxed text-slate-300"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>

                {/* ── TOP TEAMS ── */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                  <div className="flex items-center justify-between mb-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      Top Teams
                    </p>
                    <span className="text-[10px] font-medium text-slate-500">
                      {player.teams.length} teams
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {player.teams.map((team) => (
                      <div
                        key={team.name}
                        className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.04] p-3.5"
                      >
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-black/20 p-1.5">
                          <img
                            src={team.logo}
                            alt={team.name}
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-semibold text-white">
                            {team.name}
                          </p>
                          <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                            Club
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-end px-5 pt-5">
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-1 items-center justify-center px-8 text-center">
              <div>
                <p className="text-lg font-bold text-white">Select a Player</p>
                <p className="mt-2 text-sm text-slate-500">
                  Open a profile to view detailed career statistics, history,
                  and achievements.
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
