export class GetUserBookQuery {
  public constructor(
    public readonly userId: string,
    public readonly bookId: string,
  ) {}
}
