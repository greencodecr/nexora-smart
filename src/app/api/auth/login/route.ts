import { NextResponse } from 'next/server';

export async function GET() {
  const appId = process.env.EWELINK_APP_ID;
  const redirectUrl = process.env.EWELINK_REDIRECT_URL;
  const authorizeUrl = process.env.EWELINK_AUTHORIZE_URL || 'https://c2ccdn.coolkit.cc/oauth/index.html';

  if (!appId || !redirectUrl) {
    return NextResponse.json({ error: 'Missing eWeLink credentials' }, { status: 500 });
  }

  // Construct the OAuth authorization URL
  const state = Math.random().toString(36).substring(7);
  const url = new URL(authorizeUrl);
  
  url.searchParams.append('clientId', appId);
  url.searchParams.append('redirectUrl', redirectUrl);
  url.searchParams.append('grantType', 'authorization_code');
  url.searchParams.append('state', state);
  // Important: eWeLink uses seq for a unique sequence string
  url.searchParams.append('seq', Date.now().toString());

  return NextResponse.redirect(url.toString());
}
