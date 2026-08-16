import { TimestampedEntity } from '../../../common/domain/base-entity';

/**
 * User aggregate.
 *
 * This is a persistence-agnostic model: it does not know whether the data is
 * stored in PostgreSQL, Supabase or Firebase. Persistence concerns live in
 * the infrastructure layer of this vertical slice.
 */
export class User extends TimestampedEntity {
  public constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly email: string | null,
    public readonly bio: string | null,
    public readonly avatarUrl: string | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(createdAt, updatedAt);
  }

  /**
   * Factory used by application code to build a valid user.
   * Optional fields default to null and timestamps are set here so behavior
   * stays uniform regardless of the storage adapter.
   */
  public static create(input: {
    id: string;
    username: string;
    email?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
  }): User {
    const now = new Date();
    return new User(
      input.id,
      input.username,
      input.email ?? null,
      input.bio ?? null,
      input.avatarUrl ?? null,
      now,
      now,
    );
  }
}
