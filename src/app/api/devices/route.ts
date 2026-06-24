import { NextResponse } from 'next/server';
import { getEwelinkClient } from '@/lib/ewelink';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let client = await getEwelinkClient();
    
    let response = await client.device.getAllThings({});

    // If token expired or was invalidated (e.g., from a test script)
    if (response.error === 401 || (response.msg && response.msg.includes("access token"))) {
      console.log("Token invalid. Forcing re-login...");
      client = await getEwelinkClient(true);
      response = await client.device.getAllThings({});
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error fetching devices:", error);
    if (error.message === 'NOT_AUTHENTICATED') {
      return NextResponse.json({ error: 'Not authenticated. Please login again.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 });
  }
}
