-- Publicidad digital: costo porcentual sobre el lote completo, sin prorrateo

update hydrex_componentes_costo
set prorratea_por_lote = false
where nombre = 'Publicidad digital';
