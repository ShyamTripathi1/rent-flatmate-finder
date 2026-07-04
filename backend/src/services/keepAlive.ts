/**
 * Keep-Alive Service
 * 
 * Pings the backend's own /health endpoint every 14 minutes
 * to prevent Render free tier from spinning down the instance.
 * Render shuts down free-tier services after ~15 min of inactivity.
 */

const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

export function startKeepAlive(port: string | number) {
  // Only run in production (on Render)
  if (process.env.NODE_ENV !== 'production' && !process.env.RENDER) {
    console.log('[KeepAlive] Skipping — not in production environment.');
    return;
  }

  const url = process.env.RENDER_EXTERNAL_URL
    ? `${process.env.RENDER_EXTERNAL_URL}/health`
    : `http://localhost:${port}/health`;

  console.log(`[KeepAlive] Starting self-ping every 14 min → ${url}`);

  setInterval(async () => {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      console.log(`[KeepAlive] Pinged ${url} — status ${res.status}`);
    } catch (err: any) {
      console.warn(`[KeepAlive] Ping failed: ${err.message}`);
    }
  }, PING_INTERVAL_MS);
}
