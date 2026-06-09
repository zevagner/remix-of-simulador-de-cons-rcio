const ALLOWED_ORIGINS: ReadonlyArray<string | RegExp> = [
  "https://simuladordeconsorcio.seg.br",
  "https://www.simuladordeconsorcio.seg.br",
  "https://simuladordeconsorciocaixa.lovable.app",
  /^https:\/\/.*\.lovableproject\.com$/,
  /^https:\/\/.*\.lovable\.app$/,
  "http://localhost:5173",
  "http://localhost:3000",
];
const ALLOWED_HEADERS =
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

export function getCorsHeaders(req: Request, methods = "POST, OPTIONS"): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.some((o) => (typeof o === "string" ? o === origin : o.test(origin)));
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "",
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Allow-Methods": methods,
    Vary: "Origin",
  };
}
export function jsonResponse(body: Record<string, unknown>, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
export function isOriginAllowed(cors: Record<string, string>): boolean {
  return Boolean(cors["Access-Control-Allow-Origin"]);
}
