import type { SieveOptions } from '../../../../common/sieve/sieve-options';

export class GetFeedQuery {
  public constructor(
    public readonly query: SieveOptions,
    public readonly userId: string,
  ) {}
}
