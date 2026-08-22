import { TimestampedEntity } from '../../../common/domain/base-entity';

export class Post extends TimestampedEntity {
  public constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly bookId: string | null,
    public readonly content: string,
    public readonly deletedAt: Date | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(createdAt, updatedAt);
  }

  public static create(input: {
    id: string;
    userId: string;
    bookId?: string | null;
    content: string;
  }): Post {
    const now = new Date();
    return new Post(
      input.id,
      input.userId,
      input.bookId ?? null,
      input.content,
      null,
      now,
      now,
    );
  }
}
