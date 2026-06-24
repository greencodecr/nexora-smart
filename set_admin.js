const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Helper to load .env.local manually
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^([^#\s][^=]+)="?(.*?)"?$/);
      if (match) {
        process.env[match[1]] = match[2];
      }
    });
  } catch (e) {
    console.warn("Could not load .env.local automatically.");
  }
}

async function run() {
  loadEnv();
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !serviceKey) {
    console.error("❌ Faltan las variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el archivo .env.local");
    console.error("Recuerda que para este script necesitas la SERVICE_ROLE_KEY (la llave secreta) para saltarte las reglas de seguridad.");
    process.exit(1);
  }
  
  const emailToAdmin = process.argv[2];
  
  if (!emailToAdmin) {
    console.error("❌ Debes proporcionar el correo del usuario.");
    console.log("Uso: node set_admin.js <correo@ejemplo.com>");
    process.exit(1);
  }
  
  const supabase = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  console.log(`Buscando al usuario ${emailToAdmin}...`);
  
  // Buscar en auth.users requiere permisos de admin
  const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers();
  
  if (fetchError) {
    console.error("❌ Error al obtener usuarios:", fetchError.message);
    process.exit(1);
  }
  
  const user = users.find(u => u.email === emailToAdmin);
  
  if (!user) {
    console.error(`❌ No se encontró ningún usuario con el correo ${emailToAdmin}`);
    process.exit(1);
  }
  
  console.log(`✅ Usuario encontrado. ID: ${user.id}`);
  console.log(`Asignando rol 'admin'...`);
  
  // Upsert en la tabla user_roles
  const { error: upsertError } = await supabase
    .from('user_roles')
    .upsert({ user_id: user.id, role: 'admin' }, { onConflict: 'user_id' });
    
  if (upsertError) {
    console.error("❌ Error al asignar el rol:", upsertError.message);
    process.exit(1);
  }
  
  console.log(`🎉 ¡Éxito! El usuario ${emailToAdmin} ahora es administrador.`);
}

run();
