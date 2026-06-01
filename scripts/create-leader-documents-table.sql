-- Tabla para almacenar metadatos de informes PDF por líder
-- Ejecuta este script en Supabase → SQL Editor una sola vez.
-- Después, crea un bucket llamado "leader-documents" en Supabase Storage (privado).

create table if not exists leader_documents (
  id          uuid default gen_random_uuid() primary key,
  leader_id   integer not null references leaders(id) on delete cascade,
  file_name   text not null,
  file_path   text not null,
  file_size   integer,
  notes       text,
  competencies_flagged text[] default '{}',
  created_at  timestamp with time zone default now(),
  updated_at  timestamp with time zone default now()
);

-- Índice para búsquedas por líder
create index if not exists leader_documents_leader_id_idx on leader_documents(leader_id);

-- RLS: habilitar y permitir acceso autenticado (ajusta según tus políticas)
alter table leader_documents enable row level security;

create policy "Allow all operations for authenticated users"
  on leader_documents
  for all
  using (true)
  with check (true);

-- Trigger para actualizar updated_at automáticamente
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leader_documents_updated_at
  before update on leader_documents
  for each row execute function update_updated_at_column();
