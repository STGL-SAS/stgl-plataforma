# Inventario HYDREX (Fase 4)

Módulo exclusivo de costeo e inventario para HYDREX. Aislado de HANGARC, VirtualWaiter y del ledger general (salvo el punto de integración en ingresos manuales de contabilidad).

## Migraciones (aplicar manualmente)

```bash
supabase db push
```

Orden: `hydrex_catalogo` → `gastos_fijos_y_clientes` → `hydrex_componentes_costo` → `hydrex_compras_e_inventario` → `hydrex_ventas_detalle`

Seeds usan `negocios.codigo = 'HYDREX'`.

## Rutas

| Ruta | Pantalla |
|------|----------|
| `/inventario-hydrex/catalogo` | Insumos y productos |
| `/inventario-hydrex/componentes-costo` | Componentes + tarifas envío |
| `/inventario-hydrex/calculadora` | Simulador en vivo |
| `/inventario-hydrex/stock` | Stock y movimientos |
| `/inventario-hydrex/proveedores` | Proveedores y compras |
| `/inventario-hydrex/gastos-fijos` | Gastos fijos + punto equilibrio |
| `/inventario-hydrex/clientes` | Clientes + historial |

## Motor de cálculo

`lib/motor-calculo.ts` — función pura `calcularVenta()`, sin Supabase. Compartida por `/calculadora` y el formulario de ingreso HYDREX en contabilidad.

## Integración contabilidad

Cuando `negocio = HYDREX` y `tipo = ingreso` en `/contabilidad/transacciones/nueva`, aparece `VentaHydrexFormExtension`. Al guardar se crea `transacciones` + `hydrex_ventas_detalle`; el trigger descuenta inventario.
