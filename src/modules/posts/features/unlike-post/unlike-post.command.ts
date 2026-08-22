export class UnlikePostCommand {
  public constructor(
    public readonly postId: string,
    public readonly userId: string,
  ) {}
}
