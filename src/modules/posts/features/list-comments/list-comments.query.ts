import type { SieveOptions } from '../../../../common/sieve/sieve-options';

export class ListCommentsQuery {
  public constructor(
    public readonly postId: string,
    public readonly query: SieveOptions,
  ) {}
}
