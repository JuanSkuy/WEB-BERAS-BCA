export function isAuthDebugEnabled(): boolean {
  if (process.env.DEBUG_AUTH === "1") return true;
  return process.env.NODE_ENV !== "production";
}


