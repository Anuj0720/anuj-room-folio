// Live stats for players flagged with `liveSource: "ronaldo"` in data.js
// (currently ONLY Cristiano Ronaldo — everyone else stays static).
//
// Source : English Wikipedia's public MediaWiki API (no key, CORS-enabled).
//          We read the intro text of two articles and pull the career
//          figures the editors keep up to date:
//            goals, appearances, trophies, Ballon d'Or count.
// Not live: assists (the intro text has no career-assist total), so that
//          one keeps the static value from data.js.
// Age    : always computed from the date of birth (see getAge below).
//
// Safety : every field is range-checked; anything missing / unparsable /
//          offline falls back to the cached value, then to data.js. The
//          site never breaks and never shows a blank number.

import { useSyncExternalStore } from "react";

const WIKI_API = "https://en.wikipedia.org/w/api.php";
const TITLES = [
  "Cristiano Ronaldo",
  "List of career achievements by Cristiano Ronaldo",
];
const CACHE_KEY = "ronaldo-live-stats-v1";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // refresh at most every 6 hours

// Plausible ranges — protects against a bad regex match.
const LIMITS = {
  goals: [800, 1500],
  appearances: [1000, 2200],
  trophies: [20, 80],
  ballonDor: [1, 10],
};

const WORD_NUMBERS = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

// ── Parsing ──────────────────────────────────────────────────────

const toInt = (s) => parseInt(String(s).replace(/,/g, ""), 10);

// Collect every match; prefer exact figures ("a record 979 ...") over
// floors ("over 900 ..."), then take the largest.
function pickBest(text, regex, key) {
  const [min, max] = LIMITS[key];
  const found = [];
  for (const m of text.matchAll(regex)) {
    const value = toInt(m[2]);
    if (Number.isNaN(value) || value < min || value > max) continue;
    const approx = /over|more than|nearly|almost|around/i.test(m[1] || "");
    found.push({ value, approx });
  }
  if (!found.length) return null;
  const exact = found.filter((f) => !f.approx);
  const pool = exact.length ? exact : found;
  return Math.max(...pool.map((f) => f.value));
}

export function parseRonaldoStats(text) {
  const out = {};

  const goals = pickBest(
    text,
    /(?:scored|scoring|tally of)\s+((?:a\s+record\s+|over\s+|more than\s+|nearly\s+|almost\s+)?)([\d,]{3,5})\s+(?:official\s+|professional\s+)?(?:senior\s+)?(?:career\s+)?goals/gi,
    "goals",
  );
  if (goals) out.goals = goals;

  const appearances = pickBest(
    text,
    /(?:made|played|recorded)\s+((?:over\s+|more than\s+|nearly\s+|almost\s+)?)([\d,]{4,5})\s+(?:professional\s+|official\s+)?(?:senior\s+)?(?:career\s+)?(?:appearances|matches|games)/gi,
    "appearances",
  );
  if (appearances) out.appearances = appearances;

  const trophies = pickBest(
    text,
    /(won|collected|claimed)\s+(?:a\s+total\s+of\s+|over\s+|more than\s+)?(\d{2})\s+(?:career\s+)?(?:trophies|titles)/gi,
    "trophies",
  );
  if (trophies) out.trophies = trophies;

  // "five Ballon d'Or" / "5 Ballon d'Or"
  const ballon = text.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|\d{1,2})\s+(?:FIFA\s+)?Ballon d['’]Or/i);
  if (ballon) {
    const n = WORD_NUMBERS[ballon[1].toLowerCase()] ?? parseInt(ballon[1], 10);
    if (n >= LIMITS.ballonDor[0] && n <= LIMITS.ballonDor[1]) out.ballonDor = n;
  }

  return out;
}

async function fetchFromWikipedia() {
  const params = new URLSearchParams({
    action: "query",
    prop: "extracts",
    exintro: "1",
    explaintext: "1",
    exlimit: "max",
    redirects: "1",
    format: "json",
    formatversion: "2",
    origin: "*", // enables CORS
    titles: TITLES.join("|"),
  });

  const res = await fetch(`${WIKI_API}?${params}`);
  if (!res.ok) throw new Error(`Wikipedia API ${res.status}`);
  const json = await res.json();

  const text = (json?.query?.pages ?? []).map((p) => p.extract || "").join("\n");
  const stats = parseRonaldoStats(text);
  if (!Object.keys(stats).length) throw new Error("No stats found in article text");
  return stats;
}

// ── Cache ────────────────────────────────────────────────────────

function readCache() {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (raw?.stats && raw?.fetchedAt) return raw;
  } catch { /* ignore */ }
  return null;
}

function writeCache(stats, fetchedAt) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ stats, fetchedAt }));
  } catch { /* ignore (private mode, quota…) */ }
}

// ── Tiny store so React components can subscribe ────────────────

let state = { status: "idle", stats: {}, updatedAt: null };
let inflight = null;
const listeners = new Set();

function setState(next) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

// Call as early as you like; it's safe to call repeatedly.
export function loadRonaldoLiveStats() {
  if (typeof window === "undefined") return Promise.resolve();

  const cached = readCache();
  if (cached && state.status === "idle") {
    setState({ status: "live", stats: cached.stats, updatedAt: cached.fetchedAt });
  }
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return Promise.resolve();
  if (inflight) return inflight;

  if (state.status === "idle") setState({ status: "loading" });

  inflight = fetchFromWikipedia()
    .then((stats) => {
      const fetchedAt = Date.now();
      writeCache(stats, fetchedAt);
      setState({ status: "live", stats, updatedAt: fetchedAt });
    })
    .catch(() => {
      // keep whatever we already have (cache); otherwise static fallback
      if (state.status !== "live") setState({ status: "fallback" });
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const getSnapshot = () => state;

// ── Public helpers ───────────────────────────────────────────────

export function getAge(dob, now = new Date()) {
  const b = new Date(dob);
  let age = now.getFullYear() - b.getFullYear();
  const beforeBirthday =
    now.getMonth() < b.getMonth() ||
    (now.getMonth() === b.getMonth() && now.getDate() < b.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

// Returns the player with live values merged in, plus which stat keys
// are live (so the UI can mark them). Players without `liveSource`
// come back untouched.
export function useLivePlayer(player) {
  const live = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  if (!player || player.liveSource !== "ronaldo") {
    return { player, liveKeys: [], status: "static", updatedAt: null };
  }

  const liveKeys = [];
  const stats = { ...player.stats };
  for (const [key, value] of Object.entries(live.stats)) {
    if (key in stats) {
      stats[key] = value;
      liveKeys.push(key);
    }
  }

  return {
    player: {
      ...player,
      age: player.dob ? getAge(player.dob) : player.age,
      stats,
    },
    liveKeys,
    status: live.status,
    updatedAt: live.updatedAt,
  };
}
