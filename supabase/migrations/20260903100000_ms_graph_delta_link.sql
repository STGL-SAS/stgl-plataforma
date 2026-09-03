-- Token delta de OneDrive para sincronización incremental (Graph drive delta)
alter table public.ms_graph_tokens
  add column if not exists drive_delta_link text;

comment on column public.ms_graph_tokens.drive_delta_link is
  'URL @odata.deltaLink de Microsoft Graph para la próxima sincronización del drive.';
