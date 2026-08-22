# GET /sync — Pull de cambios

## Endpoint

```
GET /sync?cursor={number}
```

El cliente consulta al servidor si hay cambios posteriores a su último cursor conocido. El servidor retorna los cambios (si los existen) y el nuevo cursor.

## Query Parameters

| Parametro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `cursor` | `number` | Sí | Último `sequence` que el cliente conoce. El servidor busca `sequence > cursor` |

## Response

### Estructura

```json
{
  "changes": [
    {
      "sequence": 107,
      "entity": "user_book",
      "entityId": "b3f2c9a1-...",
      "operation": "upsert",
      "data": {
        "currentPage": 90,
        "lastReadAt": "2026-08-21T20:30:00Z"
      }
    },
    {
      "sequence": 108,
      "entity": "user",
      "entityId": "a1b2c3d4-...",
      "operation": "upsert",
      "data": {
        "name": "Juan"
      }
    }
  ],
  "cursor": 108
}
```

### Sin cambios

```json
{
  "changes": [],
  "cursor": 106
}
```

### Campos de la respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `changes` | `SyncChangeDto[]` | Array de cambios posteriores al cursor enviado |
| `changes[].sequence` | `number` | Número de secuencia del cambio |
| `changes[].entity` | `string` | Entidad afectada: `"user_book"`, `"user"`, etc. |
| `changes[].entityId` | `UUID` | ID de la entidad afectada |
| `changes[].operation` | `string` | `"upsert"` o `"delete"` |
| `changes[].data` | `object` | Datos del cambio |
| `cursor` | `number` | Último `sequence` de los cambios retornados. Si no hay cambios, retorna el cursor enviado |

## Flujo interno del handler

```
GET /sync?cursor=103
      │
      ▼
  SyncController.pull()
      │
      ▼
  PullSyncQuery { userId, cursor: 103 }
      │
      ▼
  PullSyncHandler.execute()
      │
      ▼
  repository.findChangesAfterCursor(userId, 103)
      │
      ▼
  SELECT * FROM sync_changes
  WHERE user_id = :userId
    AND sequence > 103
  ORDER BY sequence ASC
  LIMIT 100
      │
      ▼
  Si hay cambios:
      cursor = último sequence retornado
  Si no hay cambios:
      cursor = 103 (el mismo que se envió)
      │
      ▼
  { changes: [...], cursor }
```

## Código relevante

| Archivo | Responsabilidad |
|---------|----------------|
| `src/modules/sync/sync.controller.ts` | Extrae `userId` del request, lee query param `cursor`, despacha `PullSyncQuery` |
| `src/modules/sync/features/pull-sync/pull-sync.query.ts` | Define el query con `userId` y `cursor` |
| `src/modules/sync/features/pull-sync/pull-sync.handler.ts` | Consulta cambios posteriores al cursor, mapea a DTO |
| `src/modules/sync/dto/pull-sync.dto.ts` | DTO de respuesta `PullSyncResponseDto` |
| `src/modules/sync/dto/sync-change.dto.ts` | DTO de cada cambio individual |
| `src/modules/sync/domain/sync-change.repository.ts` | Puerto: `findChangesAfterCursor()` |
| `src/modules/sync/infrastructure/persistence/prisma/prisma-sync-change.repository.ts` | Implementación Prisma de la consulta |

## Comportamiento del cursor

| Escenario | `cursor` enviado | Cambios encontrados | `cursor` retornado |
|-----------|-----------------|--------------------|--------------------|
| Sin cambios nuevos | 106 | 0 | 106 |
| 3 cambios nuevos (107, 108, 109) | 106 | 3 | 109 |
| Primer sync (cursor = 0) | 0 | Todos | Último sequence |

## Paginación

El handler tiene un límite implícito de **100 cambios por request** (definido en el repository). Si un usuario tiene más de 100 cambios pendientes, deberá hacer múltiples requests:

1. `GET /sync?cursor=0` → obtiene cambios 1-100, cursor retornado: 100
2. `GET /sync?cursor=100` → obtiene cambios 101-200, cursor retornado: 200
3. `GET /sync?cursor=200` → sin cambios, cursor retornado: 200

En la práctica, para un MVP, es unlikely que un usuario tenga más de 100 cambios pendientes entre sincronizaciones.

## Notas de implementación

- La consulta usa `ORDER BY sequence ASC` para garantizar que los cambios lleguen en orden cronológico.
- El `data` en cada cambio contiene los campos de la entidad. Para `user_book` incluye `currentPage`, `lastReadAt`, etc.
- El endpoint no filtra por tipo de entidad. Si el cliente solo quiere cambios de `user_book`, debe filtrar por `entity` en el lado del cliente.
- El cursor se calcula como el `sequence` del último cambio. Si no hay cambios, se retorna el cursor enviado para que el cliente no necesite cambiarlo.
