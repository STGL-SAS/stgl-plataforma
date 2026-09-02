-- Fase 7: tareas/casos + historial automático

create table if not exists public.tareas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id),
  titulo text not null,
  descripcion text,
  tipo text not null check (tipo in ('tarea', 'caso')),
  responsable_id uuid references public.socios(id),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'en_curso', 'esperando', 'resuelto')),
  fecha_limite date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tareas_negocio on public.tareas(negocio_id);
create index if not exists idx_tareas_estado on public.tareas(estado);

alter table public.tareas enable row level security;

create policy "tareas_select_authenticated" on public.tareas
  for select to authenticated using (true);
create policy "tareas_insert_authenticated" on public.tareas
  for insert to authenticated with check (true);
create policy "tareas_update_authenticated" on public.tareas
  for update to authenticated using (true);
create policy "tareas_delete_authenticated" on public.tareas
  for delete to authenticated using (true);

-- Reutiliza set_updated_at() del resto del esquema (no función custom por tabla)
create trigger set_updated_at_tareas
  before update on public.tareas
  for each row execute function public.set_updated_at();

create table if not exists public.tareas_historial (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references public.tareas(id) on delete cascade,
  tipo_evento text not null check (
    tipo_evento in (
      'creacion',
      'cambio_estado',
      'cambio_responsable',
      'comentario',
      'documento_adjunto'
    )
  ),
  valor_anterior text,
  valor_nuevo text,
  comentario text,
  documento_id uuid references public.documentos(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_tareas_historial_tarea
  on public.tareas_historial(tarea_id);

alter table public.tareas_historial enable row level security;

create policy "tareas_historial_select_authenticated" on public.tareas_historial
  for select to authenticated using (true);
create policy "tareas_historial_insert_authenticated" on public.tareas_historial
  for insert to authenticated with check (true);
-- Sin update/delete: historial append-only.

create or replace function public.fn_tareas_historial_auto()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.tareas_historial (tarea_id, tipo_evento, valor_nuevo, created_by)
    values (new.id, 'creacion', new.estado, new.created_by);
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.estado is distinct from new.estado then
      insert into public.tareas_historial (
        tarea_id, tipo_evento, valor_anterior, valor_nuevo, created_by
      )
      values (new.id, 'cambio_estado', old.estado, new.estado, auth.uid());
    end if;

    if old.responsable_id is distinct from new.responsable_id then
      insert into public.tareas_historial (
        tarea_id, tipo_evento, valor_anterior, valor_nuevo, created_by
      )
      values (
        new.id,
        'cambio_responsable',
        old.responsable_id::text,
        new.responsable_id::text,
        auth.uid()
      );
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_tareas_historial_auto
  after insert or update on public.tareas
  for each row execute function public.fn_tareas_historial_auto();

comment on table public.tareas is
  'Tareas y casos por negocio (Fase 7).';
comment on table public.tareas_historial is
  'Historial append-only: creación/estado/responsable vía trigger; comentario y adjunto desde la app.';
