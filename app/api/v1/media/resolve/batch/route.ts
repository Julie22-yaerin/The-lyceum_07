import { NextResponse } from "next/server";
import { isAllowedPlatform, isValidHttpUrl, resolveOriginalUrl } from "@/lib/media/resolve";
import type {
  ResolveBatchRequestBody,
  ResolveBatchResponse,
  ResolveResponse,
} from "@/lib/types";

const MAX_BATCH_SIZE = 10;

/**
 * Prefetch endpoint — resolves several videos concurrently in one request,
 * used by FeedScroll to warm the shared media cache for upcoming slides
 * before the user scrolls to them (see lib/media/cache.ts). Never fails the
 * whole batch for one bad item; each slot gets its own success/error.
 */
export async function POST(req: Request): Promise<NextResponse<ResolveBatchResponse>> {
  const body = (await req.json().catch(() => null)) as Partial<ResolveBatchRequestBody> | null;
  const items = Array.isArray(body?.items) ? body.items.slice(0, MAX_BATCH_SIZE) : [];

  const results = await Promise.all(
    items.map((item): Promise<ResolveResponse> => {
      if (!isValidHttpUrl(item?.original_url) || !isAllowedPlatform(item?.platform)) {
        return Promise.resolve({ success: false, error: "Invalid original_url or platform" });
      }
      return resolveOriginalUrl(item.original_url, item.platform, item.topic).catch(
        (): ResolveResponse => ({ success: false, error: "Media Extraction Failed" })
      );
    })
  );

  return NextResponse.json({ results });
}
