-- Corrige insumos sticker creados sin talla cuando el nombre indica OneSize
update hydrex_insumos i
set atributo_2 = 'OneSize', updated_at = now()
from hydrex_tipos_insumo t
where i.tipo_insumo_id = t.id
  and t.codigo = 'sticker'
  and i.nombre ilike '%OneSize%'
  and (i.atributo_2 is null or btrim(i.atributo_2) = '');
