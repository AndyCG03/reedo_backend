export class GetPostQuery {
  public constructor(
    public readonly postId: string,
    public readonly userId: string,
  ) {}
}
