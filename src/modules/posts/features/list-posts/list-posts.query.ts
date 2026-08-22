import type { SieveOptions } from '../../../../common/sieve/sieve-options';

export class ListPostsQuery {
  public constructor(
    public readonly query: SieveOptions,
    public readonly userId?: string,
    public readonly bookId?: string,
  ) {}
}
