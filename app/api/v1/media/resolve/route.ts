import { NextResponse } from "next/server";
import { isAllowedPlatform, isValidHttpUrl, resolveOriginalUrl } from "@/lib/media/resolve";
import type { ResolveRequestBody, ResolveResponse } from "@/lib/types";

export async function POST(req: Request): Promise<NextResponse<ResolveResponse>> {
  try {
    const body = (await req.json()) as Partial<ResolveRequestBody>;
    const { original_url, platform, topic } = body;

    if (!isValidHttpUrl(original_url) || !isAllowedPlatform(platform)) {
      return NextResponse.json(
        { success: false, error: "Invalid original_url or platform" },
        { status: 400 }
      );
    }

    const result = await resolveOriginalUrl(original_url, platform, topic);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, error: "Media Extraction Failed" },
      { status: 500 }
    );
  }
}
