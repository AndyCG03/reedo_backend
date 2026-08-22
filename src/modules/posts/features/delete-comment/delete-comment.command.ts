export class DeleteCommentCommand {
  public constructor(
    public readonly commentId: string,
    public readonly userId: string,
  ) {}
}
