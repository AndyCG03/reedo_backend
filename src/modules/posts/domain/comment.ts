import { TimestampedEntity } from '../../../common/domain/base-entity';

export class Comment extends TimestampedEntity {
  public constructor(
    public readonly id: string,
    public readonly postId: string,
    public readonly userId: string,
    public readonly content: string,
    public readonly deletedAt: Date | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(createdAt, updatedAt);
  }

  public static create(input: {
    id: string;
    postId: string;
    userId: string;
    content: string;
  }): Comment {
    const now = new Date();
    return new Comment(
      input.id,
      input.postId,
      input.userId,
      input.content,
      null,
      now,
      now,
    );
  }
}
