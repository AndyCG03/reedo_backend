# Integración de Frontend (Flutter)

Guía para integrar Flutter con el sistema de sincronización del backend.

## Modelos de datos en SQLite

Flutter debe mantener tres tablas/colecciones en SQLite:

### sync_metadata

Almacena el estado de sincronización del dispositivo.

```sql
CREATE TABLE sync_metadata (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

Registro único necesario:

| key | value | Descripción |
|-----|-------|-------------|
| `last_sync_cursor` | `"106"` (string del número) | Último `sequence` del servidor que el dispositivo conoce |

### sync_queue

Cola de cambios locales pendientes por enviar al servidor.

```sql
CREATE TABLE sync_queue (
  id            TEXT PRIMARY KEY,   -- changeId (UUID)
  entity        TEXT NOT NULL,      -- "user_book", "user", etc.
  entity_id     TEXT NOT NULL,      -- UUID de la entidad
  operation     TEXT NOT NULL,      -- "upsert" | "delete"
  base_version  INTEGER NOT NULL,   -- versión que el cliente tenía
  data          TEXT NOT NULL,      -- JSON serializado
  created_at    TEXT NOT NULL       -- ISO 8601
);
```

### user_books

Copia local del progreso de lectura.

```sql
CREATE TABLE user_books (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  book_id       TEXT NOT NULL,
  current_page  INTEGER NOT NULL DEFAULT 0,
  last_read_at  TEXT,               -- ISO 8601 o null
  version       INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  UNIQUE(user_id, book_id)
);
```

> `version` se actualiza每次 que se recibe un cambio del servidor via pull.

## Endpoints del backend

| Método | Path | Descripción |
|--------|------|-------------|
| `POST` | `/sync` | Sube cambios locales al servidor |
| `GET` | `/sync?cursor={n}` | Descarga cambios remotos posteriores al cursor |

## Flujo de sincronización

### Cuándo sincronizar

```
Internet disponible
       │
       ▼
sync_queue tiene elementos?
       │
  ┌────┴────┐
  │         │
 NO        SÍ
  │         │
No hacer   POST /sync (push)
nada       │
           ▼
     GET /sync?cursor=lastCursor (pull)
           │
           ▼
     Actualizar SQLite
           │
           ▼
     Guardar nuevo cursor
```

También sincronizar al:
- Abrir la aplicación
- Volver al foreground
- Cambiar de pantalla (opcional)

### Push: enviar cambios locales

```dart
// 1. Leer todos los elementos de sync_queue
final pendingChanges = await db.rawQuery('SELECT * FROM sync_queue');

if (pendingChanges.isEmpty) return; // Nada que enviar

// 2. Construir el body
final changes = pendingChanges.map((row) => {
  'changeId': row['id'],
  'entity': row['entity'],
  'entityId': row['entity_id'],
  'operation': row['operation'],
  'baseVersion': row['base_version'],
  'data': jsonDecode(row['data'] as String),
}).toList();

// 3. POST /sync
final response = await http.post(
  Uri.parse('$baseUrl/sync'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({'changes': changes}),
);

final result = jsonDecode(response.body);

// 4. Procesar respuesta
for (final item in result['results']) {
  if (item['status'] == 'accepted' || item['status'] == 'duplicate') {
    // Eliminar de sync_queue
    await db.delete(
      'sync_queue',
      where: 'id = ?',
      whereArgs: [item['changeId']],
    );
  }
  // Si status == 'conflict', el cambio se descarta
  // (server wins policy)
}

// 5. Guardar el cursor retornado
final newCursor = result['cursor'];
await db.rawUpdate(
  'UPDATE sync_metadata SET value = ? WHERE key = ?',
  [newCursor.toString(), 'last_sync_cursor'],
);
```

### Pull: descargar cambios remotos

```dart
// 1. Leer el último cursor conocido
final cursorRow = await db.rawQuery(
  "SELECT value FROM sync_metadata WHERE key = 'last_sync_cursor'"
);
final lastCursor = int.parse(cursorRow.first['value'] as String);

// 2. GET /sync?cursor={lastCursor}
final response = await http.get(
  Uri.parse('$baseUrl/sync?cursor=$lastCursor'),
);

final result = jsonDecode(response.body);
final changes = result['changes'] as List;
final newCursor = result['cursor'];

// 3. Aplicar cada cambio a SQLite
for (final change in changes) {
  final entity = change['entity'];
  final entityId = change['entityId'];
  final operation = change['operation'];
  final data = change['data'] as Map<String, dynamic>;

  if (entity == 'user_book') {
    if (operation == 'upsert') {
      await db.rawInsert(
        '''INSERT INTO user_books (id, user_id, book_id, current_page, last_read_at, version, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             current_page = excluded.current_page,
             last_read_at = excluded.last_read_at,
             version = excluded.version,
             updated_at = excluded.updated_at''',
        [
          entityId,
          data['userId'],
          data['bookId'],
          data['currentPage'],
          data['lastReadAt'],
          data['version'],
          data['createdAt'],
          data['updatedAt'],
        ],
      );
    } else if (operation == 'delete') {
      await db.delete('user_books', where: 'id = ?', whereArgs: [entityId]);
    }
  }
}

// 4. Actualizar el cursor
await db.rawUpdate(
  'UPDATE sync_metadata SET value = ? WHERE key = ?',
  [newCursor.toString(), 'last_sync_cursor'],
);
```

## Crear un cambio local

Cuando el usuario modifica su progreso de lectura:

```dart
Future<void> updateCurrentPage(String bookId, int newPage) async {
  // 1. Leer el user_book actual
  final current = await db.rawQuery(
    'SELECT * FROM user_books WHERE book_id = ?',
    [bookId],
  );

  final userBook = current.first;
  final newVersion = (userBook['version'] as int) + 1;

  // 2. Actualizar SQLite localmente
  await db.rawUpdate(
    'UPDATE user_books SET current_page = ?, version = ?, updated_at = ? WHERE id = ?',
    [newPage, newVersion, DateTime.now().toIso8601String(), userBook['id']],
  );

  // 3. Agregar a sync_queue
  final changeId = Uuid().v4(); // UUID único
  await db.insert('sync_queue', {
    'id': changeId,
    'entity': 'user_book',
    'entity_id': userBook['id'],
    'operation': 'upsert',
    'base_version': userBook['version'], // versión ANTES del cambio
    'data': jsonEncode({
      'currentPage': newPage,
      'lastReadAt': DateTime.now().toIso8601String(),
    }),
    'created_at': DateTime.now().toIso8601String(),
  });
}
```

> **Importante:** `base_version` es la versión **antes** del cambio, no después. El servidor la usa para detectar conflictos.

## Manejo de conflictos

La política del backend es **server wins** (la versión más reciente del servidor gana).

Cuando el backend retorna `status: "conflict"`:

```dart
// El cambio fue rechazado
// Actualizar SQLite con los datos del servidor
final serverData = item['serverData'];
final serverVersion = item['serverVersion'];

await db.rawUpdate(
  'UPDATE user_books SET current_page = ?, version = ?, updated_at = ? WHERE id = ?',
  [serverData['currentPage'], serverVersion, DateTime.now().toIso8601String(), entityId],
);

// Eliminar el cambio de sync_queue (se descarta)
await db.delete('sync_queue', where: 'id = ?', whereArgs: [item['changeId']]);
```

El usuario no necesita ver un error. La UI se actualizará con los datos del servidor en el próximo pull.

## Manejo de errores de red

```dart
try {
  final response = await http.post(
    Uri.parse('$baseUrl/sync'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'changes': changes}),
  );

  if (response.statusCode == 200) {
    // Procesar respuesta y limpiar sync_queue
  } else {
    // Error del servidor, no limpiar sync_queue
    // Reintentar después
  }
} catch (e) {
  // Error de red
  // NO modificar sync_queue
  // Los cambios se reenviarán en el próximo intento
}
```

**Regla clave:** Si no se recibe respuesta del servidor, **nunca** eliminar de `sync_queue`. Los cambios se reenviarán con el mismo `changeId`, y el servidor los tratará como `duplicate`.

## Ejemplo de flujo completo

```
1. Usuario abre la app (sin internet)
   → SQLite tiene progreso local en user_books

2. Usuario avanza de página (offline)
   → updateCurrentPage() agrega cambio a sync_queue
   → sync_queue = [{ changeId: "abc", baseVersion: 5, ... }]

3. Se conecta a internet
   → Detecta sync_queue no vacía
   → POST /sync con el cambio
   → Backend retorna: status: "accepted", version: 6, cursor: 107
   → Elimina "abc" de sync_queue
   → Actualiza lastSyncCursor = 107

4. POST /sync completado, ahora hacer pull
   → GET /sync?cursor=107
   → Backend retorna cambios de otros dispositivos (si los hay)
   → Aplica cambios a SQLite
   → Actualiza lastSyncCursor al nuevo cursor

5. UI se refresca con datos actualizados
```

## Consideraciones importantes

| Tema | Detalle |
|------|---------|
| **Idempotencia** | Cada cambio tiene un `changeId` único. Reenviar el mismo cambio no lo duplica |
| **Orden** | Los cambios se envían en orden. El backend los procesa secuencialmente |
| **Conflicto** | Si hay conflicto, el servidor gana. El cliente descarta su cambio local |
| **Cursor** | Guardar siempre el cursor después de un pull exitoso |
| **sync_queue** | Solo eliminar elementos después de recibir `accepted` o `duplicate` del servidor |
| **percentage** | No se calcula en el backend. Flutter lo calcula: `currentPage / totalPages` |
| **offline** | Los cambios se acumulan en sync_queue. No hay límite estricto, pero syncronizar pronto reduce el tamaño del batch |
