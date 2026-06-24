import { SupabaseClient } from '@supabase/supabase-js';

export async function getUserRole(supabase: SupabaseClient, userId: string): Promise<'admin' | 'user'> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return 'user'; // Default fallback
    }

    return data.role as 'admin' | 'user';
  } catch (error) {
    console.error('Error fetching user role:', error);
    return 'user';
  }
}
