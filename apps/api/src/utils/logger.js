export const logger = {
  info: (message, meta) => {
    console.log(`[INFO] [${(/* @__PURE__ */ new Date()).toISOString()}] ${message}`, meta ? JSON.stringify(meta) : "");
  },
  warn: (message, meta) => {
    console.warn(`[WARN] [${(/* @__PURE__ */ new Date()).toISOString()}] ${message}`, meta ? JSON.stringify(meta) : "");
  },
  error: (message, error) => {
    console.error(`[ERROR] [${(/* @__PURE__ */ new Date()).toISOString()}] ${message}`, error?.message || error || "");
  }
};
