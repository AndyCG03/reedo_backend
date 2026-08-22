export class DeletePostCommand {
  public constructor(
    public readonly postId: string,
    public readonly userId: string,
  ) {}
}
