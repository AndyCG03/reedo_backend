import { TimestampedEntity } from '../../../common/domain/base-entity';

export class Book extends TimestampedEntity {
  public constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly totalPages: number,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(createdAt, updatedAt);
  }

  public static create(input: {
    id: string;
    title: string;
    totalPages: number;
  }): Book {
    const now = new Date();
    return new Book(input.id, input.title, input.totalPages, now, now);
  }
}
