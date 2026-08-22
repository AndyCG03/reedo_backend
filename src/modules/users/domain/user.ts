import { TimestampedEntity } from '../../../common/domain/base-entity';

export type UserRole = 'USER' | 'ADMIN';

/**
 * User aggregate.
 *
 * Persistence-agnostic model. The passwordHash field is optional so that
 * existing code that creates users without auth context keeps working. It is
 * intentionally excluded from every response DTO.
 */
export class User extends TimestampedEntity {
  public constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly email: string | null,
    public readonly bio: string | null,
    public readonly avatarUrl: string | null,
    public readonly passwordHash: string | null,
    public readonly role: UserRole,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(createdAt, updatedAt);
  }

  public static create(input: {
    id: string;
    username: string;
    email?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    passwordHash?: string | null;
    role?: UserRole;
  }): User {
    const now = new Date();
    return new User(
      input.id,
      input.username,
      input.email ?? null,
      input.bio ?? null,
      input.avatarUrl ?? null,
      input.passwordHash ?? null,
      input.role ?? 'USER',
      now,
      now,
    );
  }
}
