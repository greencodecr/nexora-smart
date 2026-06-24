-- Ejecuta esto en el SQL Editor de tu Dashboard de Supabase

-- 1. Crear la tabla operation_logs si no existe
create table if not exists public.operation_logs (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    device_id text not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    user_email text not null,
    action text not null
);

-- 2. Habilitar RLS (Row Level Security) para seguridad
alter table public.operation_logs enable row level security;

-- 3. Crear política para que todos puedan leer los logs (o ajustarlo según necesites)
create policy "Cualquier usuario logeado puede ver los logs"
on public.operation_logs
for select
to authenticated
using (true);

-- 4. Crear política para que el sistema (nuestra API) pueda insertar logs
create policy "Cualquier usuario logeado puede insertar logs"
on public.operation_logs
for insert
to authenticated
with check (true);
