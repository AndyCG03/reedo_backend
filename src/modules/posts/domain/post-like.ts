export class PostLike {
  public constructor(
    public readonly id: string,
    public readonly postId: string,
    public readonly userId: string,
    public readonly createdAt: Date,
  ) {}

  public static create(input: {
    id: string;
    postId: string;
    userId: string;
  }): PostLike {
    return new PostLike(input.id, input.postId, input.userId, new Date());
  }
}
