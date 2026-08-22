import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { UserBook } from '../../../domain/user-book';
import type { UserBookRepository } from '../../../domain/user-book.repository';
import type {
  PaginatedResult,
  SieveOptions,
} from '../../../../../common/sieve/sieve-options';
import { PrismaSieve } from '../../../../../common/sieve/prisma-sieve';
import { UserBookSieveConfig } from './user-book.sieve';

@Injectable()
export class PrismaUserBookRepository implements UserBookRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public async create(userBook: UserBook): Promise<UserBook> {
    await this.prisma.userBook.create({
      data: {
        id: userBook.id,
        userId: userBook.userId,
        bookId: userBook.bookId,
        currentPage: userBook.currentPage,
        lastReadAt: userBook.lastReadAt,
        version: userBook.version,
      },
    });
    return userBook;
  }

  public async findById(id: string): Promise<UserBook | null> {
    const record = await this.prisma.userBook.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  public async findByUserAndBook(
    userId: string,
    bookId: string,
  ): Promise<UserBook | null> {
    const record = await this.prisma.userBook.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });
    return record ? this.toDomain(record) : null;
  }

  public async findByUserId(
    userId: string,
    sieve: SieveOptions,
  ): Promise<PaginatedResult<UserBook>> {
    const userFilter = { field: 'userId', operator: '==', value: userId };
    const filters = sieve.filters
      ? [userFilter, ...sieve.filters]
      : [userFilter];

    const { where, orderBy, skip, take } = PrismaSieve.build(
      { ...sieve, filters },
      UserBookSieveConfig,
    );

    const [data, total] = await this.prisma.$transaction([
      this.prisma.userBook.findMany({ where, orderBy, skip, take }),
      this.prisma.userBook.count({ where }),
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

  public async update(userBook: UserBook): Promise<UserBook> {
    await this.prisma.userBook.update({
      where: { id: userBook.id },
      data: {
        currentPage: userBook.currentPage,
        lastReadAt: userBook.lastReadAt,
        version: userBook.version,
      },
    });
    return userBook;
  }

  private toDomain(record: {
    id: string;
    userId: string;
    bookId: string;
    currentPage: number;
    lastReadAt: Date | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): UserBook {
    return new UserBook(
      record.id,
      record.userId,
      record.bookId,
      record.currentPage,
      record.lastReadAt,
      record.version,
      record.createdAt,
      record.updatedAt,
    );
  }
}
