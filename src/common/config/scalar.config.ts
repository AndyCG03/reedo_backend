import { DocumentBuilder } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';

/**
 * Scalar / OpenAPI configuration.
 *
 * Provides a sorter that orders the OpenAPI document so Scalar renders:
 *   - Tags alphabetically
 *   - Within each tag: GET → POST → PUT/PATCH → DELETE,
 *     then alphabetically by path within the same method
 */

const METHOD_ORDER: Record<string, number> = {
  get: 0,
  post: 1,
  put: 2,
  patch: 3,
  delete: 4,
};

export const scalarConfig = new DocumentBuilder()
  .setTitle('Reading Platform API')
  .setDescription(
    'Backend for a reading application. Built with NestJS using ' +
      'Vertical Slice Architecture, CQRS and TDD.',
  )
  .setVersion('1.0.0')
  .addBearerAuth()
  .addTag('auth', 'Authentication — register, login, token refresh and logout')
  .addTag('app', 'Service health check and general API info')
  .addTag(
    'books',
    'Book catalog management. Create, retrieve and list books. ' +
      'Each book tracks total pages and reading progress per user.',
  )
  .addTag(
    'comments',
    'Social module — comments on posts. Create, update and delete comments. ' +
      'No nested threads in this MVP.',
  )
  .addTag(
    'feed',
    'Social module — chronological feed of all posts ordered by creation date. ' +
      'Supports standard Sieve pagination.',
  )
  .addTag(
    'posts',
    'Social module — publications. Create, update, delete posts ' +
      'and manage likes. Posts can optionally be linked to a book.',
  )
  .addTag(
    'sync',
    'Offline-first synchronization. Push local changes and pull remote changes ' +
      'using a cursor-based approach.',
  )
  .addTag(
    'user-books',
    'User reading progress. Track which books a user is reading, ' +
      'current page, and last read timestamp.',
  )
  .addTag(
    'users',
    'User profile management. Create, retrieve and list users. ' +
      'GET /users/me requires a valid Bearer token.',
  )
  .build();

interface FlatOperation {
  path: string;
  method: string;
  tag: string;
}

/**
 * Sorts an OpenAPI document so Scalar renders:
 *   - Tags alphabetically
 *   - Within each tag: GET → POST → PUT/PATCH → DELETE,
 *     then alphabetically by path within the same method
 */
export function sortOpenApiDocument(document: OpenAPIObject): OpenAPIObject {
  // Flatten all operations with their primary tag
  const flat: FlatOperation[] = [];

  for (const [path, pathItem] of Object.entries(document.paths)) {
    if (!pathItem) continue;

    for (const [method, operation] of Object.entries(pathItem)) {
      if (METHOD_ORDER[method] === undefined) continue;
      const op = operation as { tags?: string[] };
      const tag = op.tags?.[0] ?? '';
      flat.push({ path, method, tag });
    }
  }

  // Sort: tag alphabetically → method order → path alphabetically
  flat.sort((a, b) => {
    const tagCmp = a.tag.localeCompare(b.tag);
    if (tagCmp !== 0) return tagCmp;

    const methodCmp =
      (METHOD_ORDER[a.method] ?? 5) - (METHOD_ORDER[b.method] ?? 5);
    if (methodCmp !== 0) return methodCmp;

    return a.path.localeCompare(b.path);
  });

  // Rebuild paths preserving the sorted order.
  const sortedPaths: OpenAPIObject['paths'] = {};
  const seenPaths = new Set<string>();

  for (const { path, method } of flat) {
    if (!seenPaths.has(path)) {
      seenPaths.add(path);
      sortedPaths[path] = {};
    }
    (sortedPaths[path] as Record<string, unknown>)[method] =
      document.paths[path]![method];
  }

  document.paths = sortedPaths;

  // Rebuild tags array based on the sorted operations order
  // so Scalar renders them in the correct sequence.
  const seenTags = new Set<string>();
  const sortedTags: { name: string; description?: string }[] = [];
  for (const { tag } of flat) {
    if (tag && !seenTags.has(tag)) {
      seenTags.add(tag);
      const existing = document.tags?.find((t) => t.name === tag);
      sortedTags.push({
        name: tag,
        description: existing?.description,
      });
    }
  }
  document.tags = sortedTags;

  return document;
}
