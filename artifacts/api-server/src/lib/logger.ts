const level = process.env.LOG_LEVEL ?? "info";

const levels: Record<string, number> = { trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60 };
const currentLevel = levels[level] ?? 30;

function log(lvl: string, msg: string, extra?: Record<string, unknown>) {
  if ((levels[lvl] ?? 0) < currentLevel) return;
  const entry = JSON.stringify({ time: Date.now(), level: lvl, msg, ...extra });
  if (lvl === "error" || lvl === "fatal") {
    console.error(entry);
  } else {
    console.log(entry);
  }
}

export const logger = {
  trace: (msg: string, extra?: Record<string, unknown>) => log("trace", msg, extra),
  debug: (msg: string, extra?: Record<string, unknown>) => log("debug", msg, extra),
  info:  (msg: string, extra?: Record<string, unknown>) => log("info",  msg, extra),
  warn:  (msg: string, extra?: Record<string, unknown>) => log("warn",  msg, extra),
  error: (msg: string, extra?: Record<string, unknown>) => log("error", msg, extra),
  fatal: (msg: string, extra?: Record<string, unknown>) => log("fatal", msg, extra),
};
