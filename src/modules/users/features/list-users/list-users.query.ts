import type { SieveOptions } from '../../../../common/sieve/sieve-options';

/**
 * Query: list users with pagination, filtering and sorting.
 *
 * Carries the parsed SieveOptions so the storage layer can build
 * a filtered query without leaking HTTP concerns into the domain.
 */
export class ListUsersQuery {
  public constructor(public readonly query: SieveOptions) {}
}
