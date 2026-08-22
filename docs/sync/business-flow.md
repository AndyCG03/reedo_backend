# Sincronización — Flujo de negocio

## Problema

Un usuario puede leer en múltiples dispositivos (teléfono, tablet, etc.). Los cambios realizados offline en cada dispositivo deben sincronizarse cuando haya conexión, sin perder datos ni crear duplicados.

## Solución: Sync bidireccional con cursor y versión

El mecanismo se basa en dos conceptos fundamentales que protegen contra problemas distintos:

| Concepto | Protege contra | Pregunta que responde |
|----------|---------------|----------------------|
| **Cursor** (sequence) | Datos desactualizados | "¿Qué cambios del servidor me faltan?" |
| **Versión** (version) | Sobrescritura de datos | "¿Mi cambio sigue siendo válido?" |

No se usa `updated_at` del cliente como mecanismo de sincronización porque la hora del teléfono puede ser incorrecta o estar desincronizada.

## Tablas involucradas

### user_books

Almacena el progreso de lectura de un usuario en un libro específico.

```
user_books
─────────────────────
id              UUID (PK)
user_id         UUID (FK → users)
book_id         UUID (FK → books)
current_page    INT
last_read_at    TIMESTAMP (nullable)
version         INT          ← control de concurrencia
created_at      TIMESTAMP
updated_at      TIMESTAMP

UNIQUE(user_id, book_id)
```

- `version` comienza en 1 y se incrementa en cada actualización controlada por el servidor.
- No se almacena `percentage` (se calcula en el cliente dividiendo `current_page / total_pages`).

### sync_changes

Registra cada cambio realizado por un usuario, permitiendo que otros dispositivos lo descubran.

```
sync_changes
─────────────────────
id              BIGINT (PK, autoincrement)
user_id         UUID (FK → users)
sequence        INT          ← cursor del servidor
change_id       UUID         ← idempotencia
entity          VARCHAR(50)  ← "user_book", "user", etc.
entity_id       UUID
operation       VARCHAR(20)  ← "upsert" | "delete"
payload         JSONB
created_at      TIMESTAMP

UNIQUE(user_id, sequence)
UNIQUE(user_id, change_id)
```

- `sequence` es una secuencia por usuario (no global). Cada usuario tiene su propia secuencia 1, 2, 3, ...
- `change_id` es un UUID generado por el cliente. Permite que reenviar la misma petición después de un timeout no duplique la operación (idempotencia).
- `payload` contiene los datos del cambio en formato JSON.

## Flujo completo

```
                    FLUTTER (dispositivo A)
                       │
              ┌────────┴────────┐
              │                 │
        SQLite local        sync_queue
              │                 │
              └────────┬────────┘
                       │
                 ¿Hay cambios locales?
                       │
              ┌────────┴────────┐
              │                 │
             NO                SÍ
              │                 │
        No hacer nada     POST /sync
                              │
                              ▼
                        NEST (servidor)
                              │
                       PostgreSQL
                              │
                   ┌──────────┴──────────┐
                   │                     │
            Actualiza entidades    Crea sync_change
                   │                     │
                   └──────────┬──────────┘
                              │
                         Respuesta
                              │
                              ▼
                        FLUTTER
                              │
                   Limpia sync_queue
                              │
                              ▼
                   GET /sync?cursor=X
                              │
                              ▼
                        NEST
                              │
              Cambios con sequence > X
                              │
                              ▼
                        FLUTTER
                              │
                   Actualiza SQLite
                              │
                   Guarda nuevo cursor
```

## Escenarios clave

### 1. Dispositivo offline → online (push)

1. El usuario avanza de página mientras está sin conexión.
2. Flutter guarda el cambio localmente en `sync_queue`.
3. Al recuperar conexión, Flutter envía `POST /sync` con los cambios pendientes.
4. El servidor valida, crea `sync_change` con el siguiente `sequence`, y responde con `status: "accepted"`.
5. Flutter elimina el cambio de `sync_queue`.

### 2. Dispositivo recién encendido → sincronización (pull)

1. Flutter tiene `lastSyncCursor = 103`.
2. Al iniciar, hace `GET /sync?cursor=103`.
3. El servidor busca `sequence > 103` para ese usuario.
4. Devuelve los cambios (si los hay) y el nuevo cursor.
5. Flutter aplica los cambios a SQLite y actualiza `lastSyncCursor`.

### 3. Conflicto de versión (version conflict)

1. Dispositivo A tiene `version = 5` de un UserBook.
2. Dispositivo B modifica el mismo UserBook → `version = 6` en el servidor.
3. Dispositivo A intenta enviar su cambio con `baseVersion = 5`.
4. El servidor detecta que la versión actual (6) es mayor que la que reporta el cliente (5).
5. Devuelve `status: "conflict"` con los datos actuales del servidor.
6. Flutter actualiza SQLite con la versión del servidor y descarta el cambio local (política **server wins**).

### 4. Reenvío de petición (idempotencia)

1. Flutter envía `POST /sync` con `changeId = "abc-123"`.
2. La red falla y no recibe respuesta.
3. Flutter reenvía la misma petición con el mismo `changeId`.
4. El servidor detecta que ya procesó ese `changeId`.
5. Devuelve `status: "duplicate"` sin crear un nuevo `sync_change`.

## Resumen para el frontend

Tres conceptos que Flutter debe manejar:

| Concepto | Descripción |
|----------|-------------|
| `sync_queue` | Cola local de cambios pendientes por enviar al servidor |
| `lastSyncCursor` | Último `sequence` del servidor que el dispositivo conoce |
| `POST /sync` + `GET /sync?cursor=X` | Sube cambios locales y descarga cambios remotos |

Y en el backend:

| Concepto | Descripción |
|----------|-------------|
| `version` en `user_books` | Evita que un dispositivo viejo sobrescriba información nueva |
| `sequence` en `sync_changes` | Permite saber qué cambios remotos le faltan a cada dispositivo |
| `changeId` | Hace que reenviar una petición no duplique la operación |
