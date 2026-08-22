export class CreateBookCommand {
  public constructor(
    public readonly title: string,
    public readonly totalPages: number,
  ) {}
}
