import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { saveTokens } from '@/lib/tokenStore';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const region = searchParams.get('region') || 'us';
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${error}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=missing_code', request.url));
  }

  const appId = process.env.EWELINK_APP_ID;
  const appSecret = process.env.EWELINK_APP_SECRET;
  const redirectUrl = process.env.EWELINK_REDIRECT_URL;

  if (!appId || !appSecret || !redirectUrl) {
    return NextResponse.json({ error: 'Missing eWeLink credentials' }, { status: 500 });
  }

  try {
    const apiUrl = `https://${region}-apia.coolkit.cc`;
    
    // Create the signature
    const payload = {
      code,
      redirectUrl,
      grantType: 'authorization_code'
    };
    
    const payloadStr = JSON.stringify(payload);
    const sign = crypto.createHmac('sha256', appSecret).update(payloadStr).digest('base64');
    
    // Exchange code for token
    const tokenResponse = await fetch(`${apiUrl}/v2/user/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Sign ${sign}`,
        'X-CK-Nonce': Math.random().toString(36).substring(7),
        'X-CK-Appid': appId
      },
      body: payloadStr
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error !== 0) {
      console.error("Failed to obtain token:", tokenData);
      return NextResponse.redirect(new URL(`/?error=token_failed_${tokenData.error}`, request.url));
    }

    const { at, rt } = tokenData.data;

    // Save tokens locally in the JSON file
    saveTokens(at, rt, 30); // 30 days valid

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(new URL('/?error=internal_error', request.url));
  }
}
