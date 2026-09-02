# PROMPT PARA CURSOR — Fase 7: Tareas/Casos con Historial + Clientes HANGARC/VirtualWaiter

## Contexto del proyecto

Estás trabajando en `stgl-plataforma`, plataforma interna de gestión de STGL SAS
(Next.js + TypeScript + Tailwind + Supabase). La estructura sigue módulos
independientes bajo `src/modules/{core, contabilidad, inventario-hydrex,
documentos, tareas}`. RLS está habilitado en todas las tablas con políticas
permisivas por usuario autenticado (los roles granulares se implementan en
Fase 8, no toques eso ahora).

Ya existen (de fases anteriores):
- Tabla `negocios` (HYDREX, HANGARC, VirtualWaiter, HARDTECH, STGL).
- Tabla `socios` (Tomás y Samuel).
- Tabla `clientes` (genérica, ya usada por HYDREX y HARDTECH, con `negocio_id`
  como FK a `negocios`).
- Tabla `documentos` (Fase 6, conectada a OneDrive vía Microsoft Graph).

**No corras ninguna migración tú mismo.** Genera los archivos `.sql` dentro de
`supabase/migrations/` con el siguiente número disponible en la secuencia
(revisa los archivos existentes en esa carpeta antes de nombrar los nuevos).
Tomás las aplica manualmente con `supabase db push` desde su propia terminal.

---

## 1. Migración: tabla `tareas`

```sql
create table if not exists tareas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id),
  titulo text not null,
  descripcion text,
  tipo text not null check (tipo in ('tarea', 'caso')),
  responsable_id uuid references socios(id),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'en_curso', 'esperando', 'resuelto')),
  fecha_limite date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tareas_negocio on tareas(negocio_id);
create index if not exists idx_tareas_estado on tareas(estado);

alter table tareas enable row level security;

create policy "tareas_select_authenticated" on tareas
  for select to authenticated using (true);
create policy "tareas_insert_authenticated" on tareas
  for insert to authenticated with check (true);
create policy "tareas_update_authenticated" on tareas
  for update to authenticated using (true);
create policy "tareas_delete_authenticated" on tareas
  for delete to authenticated using (true);

-- updated_at automático
create or replace function fn_tareas_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_tareas_updated_at
  before update on tareas
  for each row execute function fn_tareas_set_updated_at();
```

---

## 2. Migración: tabla `tareas_historial`

```sql
create table if not exists tareas_historial (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references tareas(id) on delete cascade,
  tipo_evento text not null check (
    tipo_evento in ('creacion', 'cambio_estado', 'cambio_responsable',
                     'comentario', 'documento_adjunto')
  ),
  valor_anterior text,
  valor_nuevo text,
  comentario text,
  documento_id uuid references documentos(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_tareas_historial_tarea on tareas_historial(tarea_id);

alter table tareas_historial enable row level security;

create policy "tareas_historial_select_authenticated" on tareas_historial
  for select to authenticated using (true);
create policy "tareas_historial_insert_authenticated" on tareas_historial
  for insert to authenticated with check (true);
-- Sin policy de update/delete: el historial es append-only por diseño.
```

---

## 3. Trigger de historial automático (estado y responsable)

Este es el corazón del requerimiento: **nadie tiene que acordarse de anotar
nada**. Cualquier cambio de `estado` o `responsable_id` en `tareas` genera solo
su fila en `tareas_historial`.

```sql
create or replace function fn_tareas_historial_auto()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    insert into tareas_historial (tarea_id, tipo_evento, valor_nuevo, created_by)
    values (new.id, 'creacion', new.estado, new.created_by);
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.estado is distinct from new.estado then
      insert into tareas_historial (tarea_id, tipo_evento, valor_anterior, valor_nuevo, created_by)
      values (new.id, 'cambio_estado', old.estado, new.estado, auth.uid());
    end if;

    if old.responsable_id is distinct from new.responsable_id then
      insert into tareas_historial (tarea_id, tipo_evento, valor_anterior, valor_nuevo, created_by)
      values (
        new.id, 'cambio_responsable',
        old.responsable_id::text, new.responsable_id::text,
        auth.uid()
      );
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_tareas_historial_auto
  after insert or update on tareas
  for each row execute function fn_tareas_historial_auto();
```

> Nota: `security definer` es necesario para que el trigger pueda insertar en
> `tareas_historial` sin depender de que el usuario tenga permiso directo de
> insert ahí (aunque en este caso sí lo tiene, se deja así por consistencia
> y para cuando lleguen roles más restrictivos en Fase 8).

Los eventos `comentario` y `documento_adjunto` **no** pasan por este trigger —
se insertan directo desde el frontend cuando el usuario comenta o adjunta un
documento, con `created_by = auth.uid()` y `created_at = now()` puestos por
default en la tabla (el usuario nunca los digita).

---

## 4. Frontend — módulo `src/modules/tareas`

Estructura sugerida:

```
src/modules/tareas/
  components/
    TareasBoard.tsx        -> tablero por negocio (kanban con 4 columnas de estado)
    TareasList.tsx         -> vista alternativa en lista
    TareaFormModal.tsx     -> crear/editar tarea
    TareaDetail.tsx        -> vista de detalle con historial completo
    TareaHistorialTimeline.tsx -> línea de tiempo del historial
    ComentarioForm.tsx     -> agregar comentario (inserta en tareas_historial)
    AdjuntarDocumentoModal.tsx -> vincula un documento existente del módulo Documentos
  hooks/
    useTareas.ts
    useTareaHistorial.ts
  types.ts
```

Pantallas (sección 15.6):
- **Tablero**: kanban con columnas pendiente / en curso / esperando / resuelto,
  filtrado por negocio (usa el mismo selector de negocio que ya existe en
  Contabilidad e Inventario). Cada tarjeta muestra título, tipo, responsable
  y fecha límite. Debe poder alternar a vista de lista.
- **Detalle de tarea**: datos principales editables + timeline de
  `tareas_historial` ordenado descendente (más reciente arriba), mostrando
  quién hizo cada cambio y cuándo. Desde ahí se agregan comentarios y se
  adjuntan documentos (seleccionando uno ya existente en el módulo de
  Documentos de la Fase 6, no se sube un archivo nuevo desde aquí).
- Cambiar estado o responsable se hace con selects normales en el detalle;
  el historial se genera solo vía el trigger — el frontend no debe insertar
  manualmente esas dos entradas.

**Importante (estilo del proyecto):** que la UI muestre nombres claros
("Responsable", "Estado", "Historial") y no nombres de columna crudos de la
base de datos ni nombres de vistas SQL en los headings.

---

## 5. Activar Clientes para HANGARC y VirtualWaiter

No hay migración nueva. La tabla `clientes` ya soporta cualquier `negocio_id`.
Tareas de frontend:

1. En el selector de negocio de la sección de Clientes, habilitar HANGARC y
   VirtualWaiter (hoy probablemente solo aparecen HYDREX/HARDTECH — revisar
   si hay algún filtro hardcodeado en el componente que los esté excluyendo).
2. Confirmar que la ficha de cliente y el historial de interacciones
   funcionan igual para estos dos negocios sin duplicar componentes ni
   lógica — reutilizar exactamente lo construido para HYDREX/HARDTECH.
3. Si existe algún texto o copy que asuma "cliente = comprador de HYDREX",
   generalizarlo (ej. "cliente" en vez de "comprador").

---

## 6. Checklist de validación antes de reportar terminado

- [ ] Migraciones creadas en `supabase/migrations/` con numeración correcta
      (sin aplicarlas — eso lo hace Tomás).
- [ ] Trigger probado conceptualmente: al cambiar `estado` o `responsable_id`
      de una tarea, se genera automáticamente la fila correspondiente en
      `tareas_historial` sin intervención manual del frontend.
- [ ] Tablero de tareas filtra correctamente por negocio.
- [ ] Detalle de tarea muestra el historial completo, ordenado por fecha.
- [ ] Comentarios y documentos adjuntos quedan en el historial con
      `created_by`/`created_at` automáticos.
- [ ] Clientes visibles y funcionales para HANGARC y VirtualWaiter, sin
      tabla ni lógica duplicada.
- [ ] Nada de nombres de columnas o vistas SQL crudas en la UI.
