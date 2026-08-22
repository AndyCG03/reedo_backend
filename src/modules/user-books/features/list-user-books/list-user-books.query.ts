import type { SieveOptions } from '../../../../common/sieve/sieve-options';

export class ListUserBooksQuery {
  public constructor(
    public readonly userId: string,
    public readonly query: SieveOptions,
  ) {}
}
