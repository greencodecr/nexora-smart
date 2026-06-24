import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUserRole } from '@/utils/roles';
import AdminClient from './AdminClient';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const role = await getUserRole(supabase, user.id);

  if (role !== 'admin') {
    redirect('/dashboard');
  }

  // Fetch all operation logs globally
  const { data: logs, error } = await supabase
    .from('operation_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  // Initialize Admin client to get total users
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  const totalUsers = users ? users.length : 0;

  // Fetch all roles to map to users
  const { data: rolesData } = await supabaseAdmin.from('user_roles').select('*');
  
  const usersList = (users || []).map(u => {
    const roleRecord = rolesData?.find(r => r.user_id === u.id);
    return {
      id: u.id,
      email: u.email || '',
      created_at: u.created_at,
      role: roleRecord ? roleRecord.role : 'user'
    };
  });

  // Calculate stats
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = new Date(todayStart - 7 * 24 * 60 * 60 * 1000).getTime();

  let todayOpens = 0;
  let weekOpens = 0;
  let totalActivity = logs ? logs.length : 0;

  if (logs) {
    logs.forEach((log) => {
      const logTime = new Date(log.created_at).getTime();
      if (log.action === 'on') {
        if (logTime >= todayStart) todayOpens++;
        if (logTime >= weekStart) weekOpens++;
      }
    });
  }

  const stats = {
    totalUsers,
    todayOpens,
    weekOpens,
    totalActivity
  };

  return <AdminClient logs={logs || []} stats={stats} usersList={usersList} />;
}
