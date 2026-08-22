export class UserBook {
  public constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly bookId: string,
    public readonly currentPage: number,
    public readonly lastReadAt: Date | null,
    public readonly version: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  public static create(input: {
    id: string;
    userId: string;
    bookId: string;
    currentPage?: number;
    lastReadAt?: Date | null;
  }): UserBook {
    const now = new Date();
    return new UserBook(
      input.id,
      input.userId,
      input.bookId,
      input.currentPage ?? 0,
      input.lastReadAt ?? null,
      1,
      now,
      now,
    );
  }

  public update(input: {
    currentPage?: number;
    lastReadAt?: Date | null;
  }): UserBook {
    return new UserBook(
      this.id,
      this.userId,
      this.bookId,
      input.currentPage ?? this.currentPage,
      input.lastReadAt !== undefined ? input.lastReadAt : this.lastReadAt,
      this.version + 1,
      this.createdAt,
      new Date(),
    );
  }
}
