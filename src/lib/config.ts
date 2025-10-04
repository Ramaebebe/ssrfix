/* src/lib/config.ts */
export const isDemoClient =
  typeof window !== "undefined" &&
  (process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
    localStorage.getItem("afriportal:demo_mode") === "true");

export const isDemoServer = process.env.DEMO_MODE === "true";

/** Returns true if the portal should run in demo (no auth) mode */
export function isDemo() {
  if (typeof window === "undefined") return isDemoServer;
  return isDemoClient;
}

/** Small fake user used in demo flows */
export const demoUser = {
  id: "demo-user-1",
  email: "demo@afrirent.local",
  name: "Demo User",
};
