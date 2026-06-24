import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { getUserRole } from '@/utils/roles';

export async function POST(req: Request) {
  try {
    // 1. Verify the current user is an admin
    const supabaseServer = await createServerClient();
    const { data: { user: currentUser } } = await supabaseServer.auth.getUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const role = await getUserRole(supabaseServer, currentUser.id);
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const { email, password, newRole = 'user' } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 });
    }

    // 2. Initialize Supabase Admin client using Service Role Key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 3. Create the user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirm the user so they can log in immediately
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    if (!newUser.user) {
      return NextResponse.json({ error: 'Error desconocido al crear usuario' }, { status: 500 });
    }

    // 4. Assign the role in user_roles table
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: newRole
      });

    if (roleError) {
      // If role assignment fails, we should ideally delete the user or log the error, 
      // but for now we just return the error.
      return NextResponse.json({ error: 'Usuario creado pero falló la asignación de rol: ' + roleError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Usuario creado exitosamente', user: newUser.user });

  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
  }
}
