# Social Media — Visión General

## Qué es

El módulo social de Reedo permite a los usuarios compartir opiniones, reseñas y reflexiones sobre los libros que están leyendo o han leído. Es un espacio dentro de la app donde la comunidad de lectores se conecta, comenta y descubre nuevos títulos a través de las publicaciones de otros.

## Alcance del MVP

El MVP cubre los pilares fundamentales de una red social básica:

### Publicaciones (Posts)

- Crear publicaciones con contenido de texto (hasta 5000 caracteres).
- Asociar opcionalmente una publicación a un libro del catálogo.
- Editar y eliminar publicaciones (soft delete).
- Listado paginado con filtros por usuario y por libro.

### Likes

- Dar y quitar "me gusta" a una publicación.
- Cada usuario solo puede dar like una vez por publicación (restricción unique).
- Conteo de likes visible en cada publicación.

### Comentarios

- Comentar en cualquier publicación.
- Editar y eliminar comentarios propios (soft delete).
- Listado paginado de comentarios por publicación.
- Sin comentarios anidados en esta fase.

### Feed

- Vista cronológica de todas las publicaciones ordenadas por fecha de creación.
- Paginación estándar igual al listado de posts.

## Lo que NO cubre este MVP

- **Autenticación**: por ahora los endpoints usan un userId stub. La integración con JWT está planificada para una fase posterior.
- **Notificaciones**: no hay sistema de notificaciones (likes, comentarios, menciones).
- **Reportes / Moderación**: no hay mecanismos para reportar contenido ofensivo.
- **Búsqueda de usuarios**: no hay endpoint para buscar perfiles.
- **Seguir / Dejar de seguir**: no hay sistema de seguidores.
- **Multimedia**: no se permite subir imágenes, videos o archivos adjuntos.
- **Edición de perfil**: el perfil del usuario se gestiona desde el módulo de usuarios, no desde el social.

---

## Planes de Mejora Futuros

### Fase 2 — Autenticación y Seguridad

- Integrar JWT con guards de NestJS.
- Reemplazar el stub `userId` por el usuario real del token.
- Rate limiting para evitar spam de posts/likes/comentarios.
- Bloqueo de usuarios.

### Fase 3 — Social Básico

- **Sistema de seguidores**: seguir/dejar de seguir usuarios.
- **Feed personalizado**: mostrar posts de usuarios seguidos en vez del feed global.
- **Menciones**: permitir mencionar a otros usuarios con `@username`.
- **Notificaciones**: push notifications para likes, comentarios y menciones.

### Fase 4 — Enriquecimiento de Contenido

- **Imágenes en posts**: permitir subir una imagen por publicación (max 1).
- **Reacciones**: alternativas a likes (ej: ❤️, 📚, 💡).
- **Compartir**: republicar un post en el feed propio (repost/retweet).
- **Guardados**: guardar publicaciones en una lista personal.

### Fase 5 — Moderación y Calidad

- **Reportes**: sistema para reportar posts o comentarios ofensivos.
- **Moderación**: panel de administración para revisar reportes.
- **Filtros de contenido**: detección automática de contenido no deseado.
- **Bloqueo mutuo**: bloquear usuarios para que no vean tu contenido.

### Fase 6 — Avanzado

- **Búsqueda de posts**: búsqueda por contenido, hashtags o libros.
- **Hashtags**: sistema de etiquetas para categorizar publicaciones.
- **Estadísticas**: métricas de engagement para autores de posts.
- **Recomendaciones**: sugerir posts basados en libros leídos o gustos.
- **Comentarios anidados**: respuestas a comentarios (threads).
- **Edición de comentarios**: historial de ediciones visible.
