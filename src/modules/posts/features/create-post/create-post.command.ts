export class CreatePostCommand {
  public constructor(
    public readonly userId: string,
    public readonly content: string,
    public readonly bookId?: string | null,
  ) {}
}
