import type { SieveOptions } from '../../../../common/sieve/sieve-options';

export class ListBooksQuery {
  public constructor(public readonly query: SieveOptions) {}
}
