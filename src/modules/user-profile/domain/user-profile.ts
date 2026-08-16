/**
 * User profile domain aggregate.
 *
 * This is a persistence-agnostic model: it does not know whether the data is
 * stored in PostgreSQL, Supabase or Firebase. Persistence concerns live in
 * the infrastructure layer of this vertical slice.
 */
export class UserProfile {
  public constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly displayName: string,
    public readonly bio: string | null,
    public readonly avatarUrl: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory used by application code to build a valid profile.
   * Optional fields default to null and timestamps are set here so behavior
   * stays uniform regardless of the storage adapter.
   */
  public static create(input: {
    id: string;
    username: string;
    displayName: string;
    bio?: string | null;
    avatarUrl?: string | null;
  }): UserProfile {
    const now = new Date();
    return new UserProfile(
      input.id,
      input.username,
      input.displayName,
      input.bio ?? null,
      input.avatarUrl ?? null,
      now,
      now,
    );
  }
}
