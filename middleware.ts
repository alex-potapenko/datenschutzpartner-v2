import { NextResponse, type NextRequest } from 'next/server';
import {
  AFFILIATE_TARGET_PARAM,
  affiliateTargetPathFromMarketingSegment,
} from '@/lib/affiliate-attribution';

/** Partner links use `/marketing-page/ref/{id}/` — rewrite to `/ref/{id}?to=…` for the app route. */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (/^\/ref\/[^/]+\/?$/.test(pathname)) return NextResponse.next();

  const match = pathname.match(/^\/(.+?)\/ref\/([^/]+)\/?$/);
  if (!match) return NextResponse.next();

  const marketingSegment = match[1] ?? '';
  const slug = match[2] ?? '';
  if (!marketingSegment || !slug) return NextResponse.next();
  const targetPath = affiliateTargetPathFromMarketingSegment(marketingSegment);

  const url = request.nextUrl.clone();
  url.pathname = `/ref/${slug}`;
  url.searchParams.set(AFFILIATE_TARGET_PARAM, targetPath);
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
