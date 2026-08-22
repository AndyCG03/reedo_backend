/**
 * RefreshToken aggregate.
 *
 * Represents an active session. The raw token is never stored — only its
 * Argon2 hash is persisted so a database breach cannot be used to hijack
 * sessions.
 */
export class RefreshToken {
  public constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tokenHash: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
    public readonly revokedAt: Date | null,
  ) {}

  public get isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  public get isRevoked(): boolean {
    return this.revokedAt !== null;
  }

  public get isValid(): boolean {
    return !this.isExpired && !this.isRevoked;
  }

  public static create(input: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): RefreshToken {
    return new RefreshToken(
      input.id,
      input.userId,
      input.tokenHash,
      input.expiresAt,
      new Date(),
      null,
    );
  }
}
