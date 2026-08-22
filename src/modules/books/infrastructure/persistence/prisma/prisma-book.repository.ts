import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { Book } from '../../../domain/book';
import type { BookRepository } from '../../../domain/book.repository';
import type {
  PaginatedResult,
  SieveOptions,
} from '../../../../../common/sieve/sieve-options';
import { PrismaSieve } from '../../../../../common/sieve/prisma-sieve';
import { BookSieveConfig } from './book.sieve';

@Injectable()
export class PrismaBookRepository implements BookRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public async create(book: Book): Promise<Book> {
    await this.prisma.book.create({
      data: {
        id: book.id,
        title: book.title,
        totalPages: book.totalPages,
      },
    });
    return book;
  }

  public async findById(id: string): Promise<Book | null> {
    const record = await this.prisma.book.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  public async findMany(sieve: SieveOptions): Promise<PaginatedResult<Book>> {
    const { where, orderBy, skip, take } = PrismaSieve.build(
      sieve,
      BookSieveConfig,
    );

    const [data, total] = await this.prisma.$transaction([
      this.prisma.book.findMany({ where, orderBy, skip, take }),
      this.prisma.book.count({ where }),
    ]);

    return {
      data: data.map((record) => this.toDomain(record)),
      meta: {
        total,
        page: sieve.page,
        pageSize: sieve.pageSize,
        totalPages: Math.ceil(total / sieve.pageSize),
        lastPage: Math.ceil(total / sieve.pageSize),
      },
    };
  }

  private toDomain(record: {
    id: string;
    title: string;
    totalPages: number;
    createdAt: Date;
    updatedAt: Date;
  }): Book {
    return new Book(
      record.id,
      record.title,
      record.totalPages,
      record.createdAt,
      record.updatedAt,
    );
  }
}
