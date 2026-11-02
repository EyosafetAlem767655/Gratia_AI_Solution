import { getAuth } from "@/lib/auth";

// Written out rather than `toNextJsHandler(getAuth())` at module scope, so the
// auth instance (and its database) is only created when a request arrives.
export function GET(request: Request) {
  return getAuth().handler(request);
}

export function POST(request: Request) {
  return getAuth().handler(request);
}
