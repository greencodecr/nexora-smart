import { NextRequest, NextResponse } from 'next/server';
import { getEwelinkClient } from '@/lib/ewelink';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { id, params, type = 1 } = body; 

    if (!id || !params) {
      return NextResponse.json({ error: 'Missing device id or params' }, { status: 400 });
    }

    let client = await getEwelinkClient();
    
    // Set device status using ewelink-api-next
    let response = await client.device.setThingStatus({
      type,
      id,
      params
    });

    if (response.error === 401 || (response.msg && response.msg.includes("access token"))) {
      console.log("Token invalid during toggle. Forcing re-login...");
      client = await getEwelinkClient(true);
      response = await client.device.setThingStatus({
        type,
        id,
        params
      });
    }

    // If successful and we have a user, log to Supabase
    if (response.error === 0 && user) {
      const isMultiChannel = Array.isArray(params.switches);
      const action = isMultiChannel ? params.switches[0].switch : params.switch;
      
      await supabase.from('operation_logs').insert({
        device_id: id,
        user_id: user.id,
        user_email: user.email,
        action: action || 'unknown'
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error setting device status:", error);
    return NextResponse.json({ error: 'Failed to set status' }, { status: 500 });
  }
}
