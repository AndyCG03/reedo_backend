import type { PaginateQuery } from '@nestarc/pagination';

/**
 * Query: list users with offset/cursor pagination, filtering and sorting.
 *
 * Carries the parsed @nestarc/pagination query so the storage layer can build
 * a filtered query without leaking HTTP concerns into the domain.
 */
export class ListUsersQuery {
  public constructor(public readonly query: PaginateQuery) {}
}
