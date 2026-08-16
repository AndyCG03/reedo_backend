/**
 * Query: fetch a single user by id.
 *
 * Queries represent read intents and are dispatched through the QueryBus.
 */
export class GetUserQuery {
  public constructor(public readonly userId: string) {}
}
