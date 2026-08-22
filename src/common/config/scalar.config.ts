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
  // Sort tags alphabetically
  if (document.tags) {
    document.tags.sort((a, b) => a.name.localeCompare(b.name));
  }

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
  // Each path key appears once; operations within it are sorted by method.
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

  return document;
}
