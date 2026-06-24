import { NextResponse } from 'next/server';
import { getEwelinkClient } from '@/lib/ewelink';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const deviceId = '100253c515'; // Porton Residencial fixed ID

    // 1. Fetch eWeLink history
    let client = await getEwelinkClient();
    let ewelinkLogs: any[] = [];
    try {
      // Must call getAllThings first to populate client cache before getOperationHistory works
      let thingsRes = await client.device.getAllThings({});
      if (thingsRes.error === 401 || (thingsRes.msg && thingsRes.msg.includes('access token'))) {
        client = await getEwelinkClient(true);
        thingsRes = await client.device.getAllThings({});
      }

      const historyRes = await client.device.getOperationHistory({ deviceId, num: 30 });
      console.log('[Audit] eWeLink history response error:', historyRes?.error, 'data keys:', Object.keys(historyRes?.data || {}));

      if (historyRes.error === 0 && historyRes.data && (historyRes.data.history || historyRes.data.histories)) {
        ewelinkLogs = historyRes.data.history || historyRes.data.histories;
        console.log('[Audit] Got', ewelinkLogs.length, 'eWeLink logs');
      }
    } catch (e) {
      console.warn('Failed to fetch eWeLink history for audit', e);
    }

    // 2. Fetch ALL Supabase logs (global audit, no device filter)
    const supabase = await createClient();
    const { data: supabaseLogs, error: supabaseError } = await supabase
      .from('operation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (supabaseError) {
      console.warn('Failed to fetch Supabase logs', supabaseError);
    }

    // 3. Merge and format both sources
    const combinedLogs: any[] = [];

    // Map eWeLink logs
    for (const log of ewelinkLogs) {
      const action = log.opsSwitchs?.[0]?.switch || log.params?.switch || (log.params?.switches && log.params.switches[0]?.switch) || 'unknown';
      const time = log.opsTime || log.time || Date.now();

      combinedLogs.push({
        id: `ewelink-${time}`,
        time: new Date(time).getTime(),
        source: log.userAgent === 'app' ? 'eWeLink App' : 'Físico / Remoto',
        user: log.opsAccount || 'Sistema',
        device_id: deviceId,
        action,
        raw: log
      });
    }

    // Map Supabase logs
    if (supabaseLogs) {
      for (const log of supabaseLogs) {
        combinedLogs.push({
          id: `supabase-${log.id}`,
          time: new Date(log.created_at).getTime(),
          source: 'Nexora Smart',
          user: log.user_email,
          device_id: log.device_id,
          action: log.action,
          raw: log
        });
      }
    }

    // 4. Sort by time descending
    combinedLogs.sort((a, b) => b.time - a.time);

    // 5. Deduplicate within 3-second window for same action
    const deduplicatedLogs: any[] = [];
    for (const log of combinedLogs) {
      const duplicate = deduplicatedLogs.find(
        (existing) =>
          existing.action === log.action &&
          existing.device_id === log.device_id &&
          Math.abs(existing.time - log.time) < 3000
      );

      if (duplicate) {
        // Prefer Nexora Smart entry (has user email)
        if (log.source === 'Nexora Smart' && duplicate.source !== 'Nexora Smart') {
          duplicate.source = log.source;
          duplicate.user = log.user;
        }
      } else {
        deduplicatedLogs.push(log);
      }
    }

    return NextResponse.json({ logs: deduplicatedLogs.slice(0, 200) });
  } catch (error) {
    console.error('Error fetching global audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
