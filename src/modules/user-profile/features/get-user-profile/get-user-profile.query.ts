/**
 * Query: fetch a single user profile by id.
 *
 * Queries represent read intents and are dispatched through the QueryBus.
 */
export class GetUserProfileQuery {
  public constructor(public readonly profileId: string) {}
}
