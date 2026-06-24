import { NextRequest, NextResponse } from 'next/server';
import { getEwelinkClient } from '@/lib/ewelink';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deviceId = params.id;
    if (!deviceId) {
      return NextResponse.json({ error: 'Missing device id' }, { status: 400 });
    }

    // 1. Fetch eWeLink history
    let client = await getEwelinkClient();
    let ewelinkLogs: any[] = [];
    try {
      let historyRes = await client.device.getOperationHistory({ deviceId, num: 30 });
      
      if (historyRes.error === 401 || (historyRes.msg && historyRes.msg.includes("access token"))) {
        console.log("Token invalid during history fetch. Forcing re-login...");
        client = await getEwelinkClient(true);
        historyRes = await client.device.getOperationHistory({ deviceId, num: 30 });
      }

      if (historyRes.error === 0 && historyRes.data && historyRes.data.history) {
        ewelinkLogs = historyRes.data.history;
      }
    } catch (e) {
      console.warn("Failed to fetch eWeLink history", e);
    }

    // 2. Fetch Supabase logs
    const supabase = await createClient();
    const { data: supabaseLogs, error: supabaseError } = await supabase
      .from('operation_logs')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })
      .limit(30);
      
    if (supabaseError) {
      console.warn("Failed to fetch Supabase logs", supabaseError);
    }

    // 3. Merge and format logs
    // eWeLink format: { time: timestamp_ms, params: { switch: 'on' }, ... }
    // Supabase format: { created_at: string, user_email: string, action: string, ... }
    
    const combinedLogs = [];

    // Map eWeLink logs
    for (const log of ewelinkLogs) {
      const action = log.opsSwitchs?.[0]?.switch || log.params?.switch || (log.params?.switches && log.params.switches[0]?.switch) || 'unknown';
      const time = log.opsTime || log.time || Date.now();
      
      combinedLogs.push({
        id: `ewelink-${time}`,
        time: new Date(time).getTime(),
        source: log.userAgent === 'app' ? 'eWeLink App' : 'Físico / Remoto',
        user: log.opsAccount || 'Sistema',
        action: action,
        raw: log
      });
    }

    // Map Supabase logs
    if (supabaseLogs) {
      for (const log of supabaseLogs) {
        combinedLogs.push({
          id: `supabase-${log.id}`,
          time: new Date(log.created_at).getTime(),
          source: 'Arroyo App',
          user: log.user_email,
          action: log.action,
          raw: log
        });
      }
    }

    // 4. Sort combined logs by time descending
    combinedLogs.sort((a, b) => b.time - a.time);

    // 5. Deduplicate (optional, if an action was triggered by Arroyo App, it might also appear in eWeLink logs moments later)
    // We can group them if they are within 2 seconds of each other with the same action
    const deduplicatedLogs = [];
    for (const log of combinedLogs) {
      const duplicate = deduplicatedLogs.find(
        (existing) => 
          existing.action === log.action && 
          Math.abs(existing.time - log.time) < 3000 // 3 seconds window
      );

      if (duplicate) {
        // If we found a duplicate, and the current log is from Arroyo App, 
        // we prefer to keep the Arroyo App info (since it has the user email).
        if (log.source === 'Arroyo App' && duplicate.source !== 'Arroyo App') {
          duplicate.source = log.source;
          duplicate.user = log.user;
        }
      } else {
        deduplicatedLogs.push(log);
      }
    }

    return NextResponse.json({ logs: deduplicatedLogs.slice(0, 30) });
  } catch (error) {
    console.error("Error fetching device history:", error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
