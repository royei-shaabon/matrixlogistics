import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const raw = req.cookies.get("pending_google")?.value;
  if (!raw) return NextResponse.json({ pending: false });
  try {
    const data = JSON.parse(raw);
    const res = NextResponse.json({ pending: true, ...data });
    res.cookies.delete("pending_google");
    return res;
  } catch {
    return NextResponse.json({ pending: false });
  }
}
