# POST /sync — Push de cambios

## Endpoint

```
POST /sync
```

El cliente envía los cambios locales pendientes al servidor. El servidor los procesa, crea los registros en `sync_changes`, y devuelve el resultado de cada cambio.

## Request

### Headers

```
Content-Type: application/json
```

> En producción se espera un header de autenticación (JWT, etc.) que identifique al usuario. Actualmente el `userId` se extrae de `req.userId` con un fallback a un UUID por defecto.

### Body

```json
{
  "changes": [
    {
      "changeId": "550e8400-e29b-41d4-a716-446655440000",
      "entity": "user_book",
      "entityId": "b3f2c9a1-...",
      "operation": "upsert",
      "baseVersion": 4,
      "data": {
        "currentPage": 80,
        "lastReadAt": "2026-08-21T20:00:00Z"
      }
    }
  ]
}
```

### Campos del body

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `changes` | `PushChangeDto[]` | Sí | Array de cambios a procesar |
| `changes[].changeId` | `UUID` | Sí | ID único generado por el cliente. Usado para idempotencia |
| `changes[].entity` | `string` | Sí | Entidad afectada: `"user_book"`, `"user"`, etc. |
| `changes[].entityId` | `UUID` | Sí | ID de la entidad afectada |
| `changes[].operation` | `string` | Sí | `"upsert"` o `"delete"` |
| `changes[].baseVersion` | `number` | Sí | Versión que el cliente tenía al momento de hacer el cambio |
| `changes[].data` | `object` | Sí | Datos del cambio (campos a actualizar) |

## Response

### Estructura

```json
{
  "results": [
    {
      "changeId": "550e8400-e29b-41d4-a716-446655440000",
      "status": "accepted",
      "entityId": "b3f2c9a1-...",
      "version": 5
    }
  ],
  "conflicts": [],
  "cursor": 107
}
```

### Campos de la respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `results` | `PushResultItemDto[]` | Resultado de cada cambio procesado |
| `results[].changeId` | `UUID` | ID del cambio enviado |
| `results[].status` | `string` | `"accepted"`, `"conflict"` o `"duplicate"` |
| `results[].entityId` | `UUID` | ID de la entidad (solo en `accepted`) |
| `results[].version` | `number` | Nueva versión tras aceptar el cambio (solo en `accepted`) |
| `results[].serverVersion` | `number` | Versión actual en el servidor (solo en `conflict`) |
| `results[].serverData` | `object` | Datos actuales en el servidor (solo en `conflict`) |
| `conflicts` | `PushResultItemDto[]` | Cambios que fueron rechazados por conflicto de versión |
| `cursor` | `number` | Último sequence generado. Usado para el pull posterior |

### Estados posibles

| Status | Significado | Acción del cliente |
|--------|------------|-------------------|
| `accepted` | El cambio fue procesado correctamente | Eliminar de `sync_queue` |
| `duplicate` | El `changeId` ya fue procesado anteriormente | Eliminar de `sync_queue` (ya está en el servidor) |
| `conflict` | La versión en el servidor es más reciente que `baseVersion` | Actualizar SQLite con `serverData` y descartar cambio local |

## Flujo interno del handler

```
POST /sync
      │
      ▼
  SyncController.push()
      │
      ▼
  PushSyncCommand
      │
      ▼
  PushSyncHandler.execute()
      │
      ▼
  Por cada change:
      │
      ├── ¿changeId ya existe para este userId?
      │       ├── SÍ → status: "duplicate", skip
      │       └── NO ↓
      │
      ├── Obtener nextSequence (MAX(sequence) + 1)
      │
      ├── Crear SyncChange con:
      │       userId, sequence, changeId,
      │       entity, entityId, operation,
      │       payload = { ...data, _baseVersion: baseVersion }
      │
      └── status: "accepted", version: baseVersion + 1
      │
      ▼
  Retornar { results, conflicts, cursor }
```

## Código relevante

| Archivo | Responsabilidad |
|---------|----------------|
| `src/modules/sync/sync.controller.ts` | Extrae `userId` del request, despacha `PushSyncCommand` |
| `src/modules/sync/features/push-sync/push-sync.command.ts` | Define el command con `userId` y `changes` |
| `src/modules/sync/features/push-sync/push-sync.handler.ts` | Lógica principal: idempotencia, creación de sync_change |
| `src/modules/sync/dto/push-sync.dto.ts` | DTO de entrada con validaciones (`class-validator`) |
| `src/modules/sync/dto/push-sync-response.dto.ts` | DTO de respuesta |
| `src/modules/sync/domain/sync-change.ts` | Entidad de dominio `SyncChange` |
| `src/modules/sync/domain/sync-change.repository.ts` | Puerto del repository (interface) |
| `src/modules/sync/infrastructure/persistence/prisma/prisma-sync-change.repository.ts` | Adapter Prisma |

## Validaciones

El DTO de entrada aplica las siguientes validaciones automáticamente (via `class-validator` + `ValidationPipe` global):

- `changeId`: debe ser un UUID válido
- `entity`: string (cualquier valor)
- `entityId`: debe ser un UUID válido
- `operation`: debe ser `"upsert"` o `"delete"`
- `baseVersion`: debe ser un entero >= 0
- `data`: debe ser un objeto

Si algún campo falla la validación, el servidor responde con `400 Bad Request` antes de llegar al handler.

## Notas de implementación

- El `payload` almacenado en `sync_changes` incluye `_baseVersion` como metadata interna.
- El `cursor` retornado corresponde al último `sequence` generado en el batch.
- Si no se envían cambios (`changes: []`), el cursor retornado es `nextSequence - 1` (el actual).
- El handler itera los cambios secuencialmente (no en paralelo) para garantizar el orden de `sequence`.
