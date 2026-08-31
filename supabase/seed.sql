-- Datos base: negocios, socios, % de participación, cuentas
-- Pensado para ejecutarse una sola vez al inicializar la base.

insert into negocios (codigo, nombre, estado) values
  ('HYDREX', 'HYDREX', 'activo'),
  ('HANGARC', 'HANGARC', 'en_desarrollo'),
  ('VIRTUALWAITER', 'VirtualWaiter', 'en_desarrollo'),
  ('STGL', 'STGL (general)', 'activo')
on conflict (codigo) do nothing;

insert into socios (nombre, rol) values
  ('Tomás Garcés', 'superadmin'),
  ('Samuel López', 'superadmin');

insert into socios_participacion (negocio_id, socio_id, porcentaje)
select n.id, s.id, v.porcentaje
from (values
  ('HYDREX', 'Tomás Garcés', 50),
  ('HYDREX', 'Samuel López', 50),
  ('HANGARC', 'Tomás Garcés', 50),
  ('HANGARC', 'Samuel López', 50),
  ('VIRTUALWAITER', 'Tomás Garcés', 43),
  ('VIRTUALWAITER', 'Samuel López', 57)
) as v(negocio_codigo, socio_nombre, porcentaje)
join negocios n on n.codigo = v.negocio_codigo
join socios s on s.nombre = v.socio_nombre
on conflict (negocio_id, socio_id) do nothing;

insert into cuentas_bancarias (nombre, tipo, descripcion) values
  ('Bold', 'bold', 'Recibe ventas de HYDREX: Shopify, Mercado Libre, Rappi, distribuidores, ventas en persona.'),
  ('Bancolombia General', 'bancaria', 'Compartida entre HANGARC, VirtualWaiter y posibles gastos de STGL.');
