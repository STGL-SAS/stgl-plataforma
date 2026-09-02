-- Fase 6b: carpeta raíz OneDrive por negocio (mapeo HYDREX/HANGARC/…)
alter table public.negocios
  add column if not exists onedrive_root_folder_id text;

comment on column public.negocios.onedrive_root_folder_id is
  'ID Graph de la carpeta raíz del negocio en OneDrive (nombre = codigo).';
