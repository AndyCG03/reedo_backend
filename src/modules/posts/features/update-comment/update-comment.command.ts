export class UpdateCommentCommand {
  public constructor(
    public readonly commentId: string,
    public readonly userId: string,
    public readonly content: string,
  ) {}
}
