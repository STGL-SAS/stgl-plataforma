# PROMPT PARA CURSOR — Eliminación de documentos/carpetas (con validación de tareas)

## Contexto

Esto es una funcionalidad dentro del módulo de Documentos (Fase 6, ya construido,
conectado a OneDrive vía Microsoft Graph API) de `stgl-plataforma`. Hoy la
plataforma permite consultar, subir y organizar documentos, pero no eliminar.
Este prompt agrega la eliminación, con dos entradas posibles:

1. **Eliminación manual desde la plataforma** (usuario le da a "eliminar" en un
   archivo o carpeta).
2. **Eliminación detectada por sincronización con OneDrive** (alguien borró el
   archivo directamente en OneDrive, y el sistema lo detecta vía delta query
   y refleja el borrado en la plataforma).

Ambos casos terminan en el mismo resultado (fila eliminada de la BD), pero
el flujo de confirmación es distinto: uno es interactivo (hay usuario
presente para confirmar), el otro es automático (nadie está mirando en ese
momento).

## Decisión de borrado: FÍSICO, no soft-delete

A diferencia de otras partes de la plataforma, aquí se pidió explícitamente
**borrado real de la fila en la base de datos** (no soft-delete con
`eliminado_at`). Verifica cómo está definida hoy la tabla `documentos` y usa
un `DELETE` real, no un update de estado.

## Paso 0 — Verificación antes de escribir código

1. Revisa cómo están relacionados hoy `documentos` y `tareas` en el schema —
   probablemente vía una tabla puente (algo como `tareas_documentos` o un
   campo `documento_id` dentro del historial de la tarea, según cómo se haya
   implementado el "documento adjunto" de la sección 5 del documento de
   requerimientos). Confirma el nombre real de la tabla/relación antes de
   escribir las queries — no asumas el nombre.
2. Revisa cómo está estructurado el historial de tareas (Fase 7) — necesitas
   poder insertar una entrada nueva de tipo comentario/observación
   programáticamente, con autor "Sistema" (no un socio), fecha/hora, y el
   texto del evento.

Si algo de esto no existe todavía o tiene un nombre distinto al esperado,
repórtalo antes de seguir.

## Paso 1 — Eliminación manual (archivo o carpeta) desde la plataforma

Flujo al presionar "Eliminar" sobre un documento o carpeta:

1. **Buscar tareas relacionadas**: consultar si ese documento (o, si es
   carpeta, cualquier documento dentro de ella, recursivamente) está
   referenciado como adjunto en alguna tarea.
2. **Si NO hay tareas relacionadas**: confirmación simple ("¿Eliminar
   [nombre]? Esta acción no se puede deshacer") y se procede al borrado.
3. **Si SÍ hay tareas relacionadas**: mostrar un modal de confirmación que
   liste explícitamente las tareas afectadas (título de cada tarea, y a qué
   negocio pertenece), con un mensaje claro tipo: *"Este documento está
   adjunto en N tarea(s). Si continúas, se eliminará el documento y quedará
   registrado en el historial de esas tareas."* Botones: Cancelar / Confirmar
   eliminación.
4. **Al confirmar**:
   - Eliminar el archivo/carpeta real en OneDrive vía Microsoft Graph
     (`DELETE /me/drive/items/{id}`; si es carpeta, Graph borra el árbol
     completo, no hace falta recorrerlo manualmente ahí, pero sí hace falta
     recorrer la BD para saber qué filas hijas borrar).
   - Eliminar la(s) fila(s) correspondiente(s) en `documentos` (DELETE real).
   - Por cada tarea afectada: insertar una entrada en su historial con
     observación tipo: *"El documento '[nombre del archivo]' fue eliminado
     el [fecha] por [socio que lo eliminó]."* — esto debe quedar visible al
     entrar a la tarea, igual que cualquier otro evento de su historial
     (Fase 7, registro automático de cambios).
   - Quitar la referencia del documento en la tabla puente
     tareas-documentos (para que no quede un vínculo roto apuntando a un
     documento que ya no existe).
5. Si la eliminación en Graph falla (por ejemplo, el archivo ya no existe en
   OneDrive), no dejar la operación a medias: si Graph responde 404, se
   interpreta como "ya no está en OneDrive" y se continúa igual con la
   limpieza de la BD; cualquier otro error de Graph debe detener la
   operación completa y mostrar el error, sin borrar nada de la BD.

## Paso 2 — Eliminación detectada desde OneDrive (sincronización)

Esto usa el mecanismo de **delta query** de Microsoft Graph ya definido para
la sincronización de Documentos (botón "Sincronizar con OneDrive" +
opcionalmente un cron de respaldo).

Cuando el delta query devuelve un ítem marcado como eliminado en OneDrive:

1. Buscar la fila correspondiente en `documentos` (por su `onedrive_item_id`).
2. Si no existe en la BD, ignorar (nada que limpiar).
3. Si existe:
   - Buscar tareas relacionadas, igual que en el Paso 1.
   - **No hay usuario presente para confirmar** (esto corre en background),
     así que no se pregunta nada — se procede directo al borrado.
   - Eliminar la fila de `documentos` (DELETE real).
   - Por cada tarea afectada: insertar entrada en el historial, pero con un
     texto que deje claro que fue detectado por sincronización, no
     eliminado desde la plataforma: *"El documento '[nombre]' fue eliminado
     directamente en OneDrive (detectado por sincronización el [fecha])."*
   - Quitar también la referencia en la tabla puente tareas-documentos.
4. Al terminar una sincronización, si se detectaron eliminaciones, mostrar un
   resumen visible al usuario (ej. un toast o un pequeño resumen post-sync:
   "3 documentos fueron eliminados en OneDrive y sincronizados. 1 tarea fue
   actualizada.") — para que no sea un cambio silencioso e invisible.

## Paso 3 — Consideraciones de UI

- El botón/ícono de eliminar debe estar disponible tanto en la vista de lista
  como en el explorador de carpetas del módulo de Documentos.
- Al eliminar una carpeta, el modal de confirmación debe dejar explícito que
  se borra TODO su contenido (subcarpetas y archivos), no solo la carpeta
  vacía — mostrar cuántos archivos en total se van a eliminar.
- No usar nombres de tabla ni columnas internas en los mensajes al usuario
  (ej. no decir "se eliminará de tareas_documentos"), mantener el lenguaje
  en términos de negocio ("tareas", "documentos"), igual que ya se ha
  cuidado en otras partes de la plataforma.

## Paso 4 — Checklist de verificación antes de terminar

- [ ] Eliminar un documento sin tareas relacionadas: confirmación simple,
      se borra en OneDrive y en la BD.
- [ ] Eliminar un documento con 1+ tareas relacionadas: el modal lista las
      tareas correctas, y al confirmar, cada una de esas tareas muestra la
      observación nueva en su historial.
- [ ] Eliminar una carpeta con archivos y subcarpetas: se borra todo el árbol
      en OneDrive y todas las filas hijas correspondientes en la BD, y las
      tareas relacionadas a CUALQUIER archivo dentro del árbol quedan con su
      observación.
- [ ] Borrar un archivo directamente en OneDrive (fuera de la plataforma),
      correr la sincronización, y confirmar que: la fila desaparece de la
      BD, y si tenía tareas relacionadas, quedan con la observación
      correspondiente marcada como detectada por sincronización (no como
      eliminación manual).
- [ ] Simular un error de Graph distinto a 404 durante un borrado manual:
      confirmar que NO se borra nada en la BD (operación atómica, sin
      estados intermedios rotos).
