# Social Media — Arquitectura e Implementación

## Estructura del Módulo

El módulo sigue la arquitectura **Vertical Slice** del proyecto, donde cada feature vive en su propia carpeta con sus componentes aislados.

```
src/modules/posts/
├── posts.module.ts
├── domain/
│   ├── post.ts
│   ├── post.repository.ts
│   ├── comment.ts
│   ├── comment.repository.ts
│   ├── post-like.ts
│   └── post-like.repository.ts
├── dto/
│   ├── post.response.dto.ts
│   └── comment.response.dto.ts
├── features/
│   ├── create-post/
│   ├── get-post/
│   ├── list-posts/
│   ├── update-post/
│   ├── delete-post/
│   ├── like-post/
│   ├── unlike-post/
│   ├── create-comment/
│   ├── list-comments/
│   ├── update-comment/
│   ├── delete-comment/
│   └── get-feed/
└── infrastructure/persistence/prisma/
    ├── prisma-post.repository.ts
    ├── prisma-post-like.repository.ts
    ├── prisma-comment.repository.ts
    ├── post.sieve.ts
    └── comment.sieve.ts
```

Cada feature dentro de `features/` contiene:

| Archivo | Proposito |
|---------|-----------|
| `*.command.ts` | Clase Command (escrituras) o Query (lecturas) |
| `*.handler.ts` | Handler que implementa la logica de negocio |
| `*.endpoint.ts` | Controller HTTP delgado que mapea HTTP a Command/Query |
| `*.dto.ts` | DTO de entrada con validaciones class-validator |

---

## Modelo de Dominio

### Post

Entidad principal que representa una publicacion. Relaciona opcionalmente con un `User` (autor) y un `Book`.

Campos clave:
- `id` (UUID) — identificador unico
- `userId` (UUID) — usuario propietario
- `bookId` (UUID nullable) — libro relacionado opcionalmente
- `content` (Text) — contenido de la publicacion
- `deletedAt` (DateTime nullable) — para soft delete
- `createdAt` / `updatedAt` — timestamps automaticos

### PostLike

Representa el "me gusta" de un usuario en una publicacion.

- Restriccion `UNIQUE(postId, userId)` — un solo like por usuario por post
- `createdAt` — momento en que se dio el like

### Comment

Comentario de un usuario en una publicacion. Sin anidacion (MVP).

- `content` (Text) — contenido del comentario
- `deletedAt` — soft delete
- Relacion con `Post` y `User`

---

## Flujo de Datos — Enriquecimiento de Posts

La caracteristica mas importante del modulo es que las respuestas de posts vienen **enriquecidas** con informacion de multiples tablas en una sola query.

### Que incluye la respuesta

```json
{
  "id": "uuid",
  "content": "Me encanto este libro",
  "book": { "id": "uuid", "title": "La bella y la bestia" },
  "author": { "id": "uuid", "username": "bookworm" },
  "likesCount": 15,
  "likedByMe": true,
  "commentsCount": 4,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

### Como se obtiene

El repositorio Prisma usa `include` y `_count` para traer todo en una sola consulta:

```typescript
const record = await this.prisma.post.findUnique({
  where: { id },
  include: {
    user: { select: { id: true, username: true } },
    book: { select: { id: true, title: true } },
    _count: { select: { postLikes: true, comments: true } },
  },
});
```

El campo `likedByMe` se calcula con una segunda query simple:

```typescript
const like = await this.prisma.postLike.findUnique({
  where: { postId_userId: { postId: id, userId } },
});
likedByUser = !!like;
```

Esto mantiene la eficiencia (2 queries max por post) sin sacrificar la riqueza de datos.

---

## Patron de Autenticacion (Stub)

Actualmente el modulo usa el mismo patron que el modulo `sync`:

```typescript
interface AuthenticatedRequest {
  userId?: string;
}

// En cada endpoint:
const userId = req.userId || '00000000-0000-0000-0000-000000000001';
```

Esto permite que todos los endpoints funcionen sin JWT. Cuando se implemente autenticacion, solo hay que:
1. Crear un `AuthGuard` que extraiga el userId del token JWT
2. Aplicar el guard al modulo o a los endpoints individualmente
3. Eliminar el fallback `|| '00000000-...'`

---

## Soft Delete

Tanto `Post` como `Comment` usan soft delete mediante el campo `deletedAt`:

- **Crear**: `deletedAt` se inicializa en `null`
- **Eliminar**: se asigna `new Date()` a `deletedAt`
- **Consultar**: todas las queries incluyen `WHERE deletedAt IS NULL` (filtrado en el repositorio)

Esto preserva los datos para auditoria y permite restauraciones en el futuro.

---

## Paginacion con Sieve

El modulo usa el sistema Sieve existente del proyecto para paginacion, filtrado y ordenamiento:

- `page` — numero de pagina (default: 1)
- `pageSize` — elementos por pagina (default: 20, max: 100)
- `filters` — filtros shorthand, ej: `userId==abc123`
- `sorts` — ordenamiento, ej: `createdAt:desc`

### Filtros disponibles

| Endpoint | Filtros |
|----------|---------|
| `GET /posts` | `userId`, `bookId`, `createdAt`, `updatedAt`, `content` |
| `GET /feed` | Igual que posts |
| `GET /posts/:id/comments` | `userId`, `postId`, `createdAt` |

Los siege configs definen que campos son filtrables y ordenables:

```typescript
export const PostSieveConfig: PrismaSieveConfig<Prisma.PostWhereInput> = {
  content: { canFilter: true, canSort: false },
  userId: { canFilter: true, canSort: false },
  bookId: { canFilter: true, canSort: false },
  createdAt: { canFilter: true, canSort: true },
  updatedAt: { canFilter: true, canSort: true },
};
```

---

## Estrategia de Repositorio

Cada entidad tiene su propio repository port (interfaz) y adaptador Prisma:

| Port (interfaz) | Adaptador | Token DI |
|------------------|-----------|----------|
| `PostRepository` | `PrismaPostRepository` | `POST_REPOSITORY` |
| `PostLikeRepository` | `PrismaPostLikeRepository` | `POST_LIKE_REPOSITORY` |
| `CommentRepository` | `PrismaCommentRepository` | `COMMENT_REPOSITORY` |

Los handlers dependen unicamente de las interfaces, lo que permite:
- Tests unitarios con mocks
- Cambiar de PostgreSQL a otra base de datos sin tocar la logica de negocio
- Inyeccion de dependencias limpia via el modulo NestJS
