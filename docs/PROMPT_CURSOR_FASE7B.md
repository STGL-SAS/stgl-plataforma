# PROMPT PARA CURSOR — Ajuste Fase 7b: Adjuntar documentos en Tareas (creación + múltiple + subir nuevo)

## Contexto

Ya existe el módulo `src/modules/tareas` (Fase 7) funcionando: tablero, detalle,
historial automático, comentarios. El único punto pendiente de mejora es el
flujo de **documentos adjuntos**:

**Problema actual:**
- Solo se puede adjuntar un documento a la vez, desde un `<select>` simple.
- Solo se puede adjuntar *después* de que la tarea ya fue creada (desde el
  detalle) — el modal de "Nueva tarea o caso" no tiene esa opción.
- Solo permite elegir documentos que ya existen en el módulo Documentos
  (Fase 6) — no se puede subir uno nuevo desde ahí.

**Objetivo de este ajuste:**
- Poder adjuntar uno o varios documentos, ya sea buscando entre los
  existentes o subiendo uno nuevo, tanto al crear la tarea como al editarla.

No se necesita ninguna migración nueva — la tabla `tareas_historial` ya
soporta múltiples filas `tipo_evento = 'documento_adjunto'` por tarea.

---

## 1. Nuevo componente compartido: `DocumentoPicker`

Ubicación: `src/modules/tareas/components/DocumentoPicker.tsx`

Responsabilidad única: dejar que el usuario termine con una lista de
`documento_id[]` seleccionados, sin importar si venían de una búsqueda o de
una subida nueva. No sabe nada de tareas ni de historial — solo devuelve IDs.

Props sugeridas:
```ts
interface DocumentoPickerProps {
  negocioId: string;               // para preseleccionar/filtrar por negocio
  yaAdjuntados?: string[];         // documento_id ya vinculados (se muestran deshabilitados/marcados)
  onChange: (documentoIds: string[]) => void; // lista actual seleccionada
}
```

UI con dos pestañas:

**Pestaña "Buscar existentes"**
- Input de búsqueda (filtra por nombre/categoría dentro del negocio elegido,
  reutiliza la función de búsqueda que ya existe en el módulo Documentos —
  no la reescribas).
- Lista de resultados con checkbox (selección múltiple).
- Los que ya están en `yaAdjuntados` aparecen marcados y deshabilitados (no
  se pueden volver a adjuntar duplicados).

**Pestaña "Subir nuevo"**
- Reutiliza el componente de upload que ya existe en
  `src/modules/documentos` (el que sube a OneDrive vía Microsoft Graph y
  crea la ficha en la tabla `documentos`). No dupliques esa lógica.
- Al terminar de subir exitosamente, el documento nuevo se agrega
  automáticamente a la selección (se ve como "chip" seleccionado, igual que
  uno elegido en la otra pestaña).
- Permite subir varios seguidos antes de cerrar.

Debajo de las pestañas, mostrar siempre los "chips" de todo lo seleccionado
hasta el momento (existentes + nuevos), con opción de quitar cualquiera antes
de confirmar.

---

## 2. Uso en "Nueva tarea o caso" (`TareaFormModal.tsx`)

- Agregar sección **"Documentos"** al formulario, usando `DocumentoPicker`
  (sin `yaAdjuntados`, porque la tarea no existe todavía).
- El estado de documentos seleccionados vive solo en el formulario (no se
  escribe nada en base de datos todavía).
- Al dar **Guardar**:
  1. Insertar la fila en `tareas` (como ya funciona hoy).
  2. Con el `id` recién creado, insertar en `tareas_historial` una fila por
     cada documento seleccionado: `tipo_evento = 'documento_adjunto'`,
     `documento_id`, `tarea_id`, `created_by = auth.uid()`.
  3. Si el paso 1 fue exitoso pero algún insert del paso 2 falla, no revertir
     la tarea — solo mostrar un aviso de que algún documento no quedó
     adjuntado, para no perder la tarea creada.

---

## 3. Uso en el detalle (`TareaDetail.tsx` / modal actual de adjuntar)

- Reemplazar el modal actual (el `<select>` de uno solo) por
  `DocumentoPicker`, pasando `yaAdjuntados` con los `documento_id` que ya
  aparecen en el historial de esa tarea.
- Botón **"Adjuntar"** ahora inserta una fila en `tareas_historial` por cada
  documento nuevo seleccionado (no solo uno), en batch.
- El timeline del historial debe seguir mostrando cada documento adjuntado
  como una entrada individual (no agrupada), igual que hoy.

---

## 4. Detalles de UX a mantener

- Nombres claros en la UI ("Documentos", "Buscar", "Subir nuevo") — nada de
  nombres de tabla o columna cruda.
- El flujo de subida debe respetar las reglas ya establecidas del módulo
  Documentos (categoría, negocio, ficha en OneDrive) — este ajuste solo
  cambia *desde dónde* se dispara esa subida, no la lógica de subida en sí.
- Si el negocio de la tarea es "STGL (general)", la búsqueda/subida de
  documentos debe filtrar por esa categoría igual que ya lo hace el módulo
  Documentos para STGL.

---

## 5. Checklist de validación

- [ ] Se puede crear una tarea nueva adjuntando 2+ documentos existentes
      de una sola vez, y quedan en el historial apenas se guarda la tarea.
- [ ] Se puede subir un documento nuevo desde el modal de creación de tarea,
      sin salir de ahí, y queda tanto en el módulo Documentos como adjuntado
      a la tarea.
- [ ] Desde el detalle de una tarea ya existente, se pueden adjuntar varios
      documentos a la vez (existentes y/o nuevos).
- [ ] No se pueden adjuntar documentos duplicados a la misma tarea.
- [ ] `npm run build` pasa sin errores.
