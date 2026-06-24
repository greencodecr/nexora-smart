import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { getUserRole } from '@/utils/roles';

// Helper to check admin access and init supabase Admin Client
async function getAdminClient() {
  const supabaseServer = await createServerClient();
  const { data: { user: currentUser } } = await supabaseServer.auth.getUser();
  
  if (!currentUser) return null;

  const role = await getUserRole(supabaseServer, currentUser.id);
  if (role !== 'admin') return null;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// UPDATE User (Password or Role)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabaseAdmin = await getAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { password, role } = body;

    // 1. Update Password if provided
    if (password && password.trim() !== '') {
      const { error: passError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password: password
      });
      if (passError) {
        return NextResponse.json({ error: 'Error al actualizar contraseña: ' + passError.message }, { status: 400 });
      }
    }

    // 2. Update Role if provided
    if (role) {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({ user_id: id, role: role }, { onConflict: 'user_id' });
        
      if (roleError) {
        return NextResponse.json({ error: 'Error al actualizar rol: ' + roleError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ message: 'Usuario actualizado correctamente' });

  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
  }
}

// DELETE User
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabaseAdmin = await getAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = params;

    // First, delete role from user_roles to avoid foreign key constraint errors
    await supabaseAdmin.from('user_roles').delete().eq('user_id', id);

    // Then, delete the user from auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (deleteError) {
      return NextResponse.json({ error: 'Error al borrar usuario: ' + deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Usuario eliminado correctamente' });

  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
  }
}
