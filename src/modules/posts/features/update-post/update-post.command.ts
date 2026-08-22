export class UpdatePostCommand {
  public constructor(
    public readonly postId: string,
    public readonly userId: string,
    public readonly content: string,
  ) {}
}
