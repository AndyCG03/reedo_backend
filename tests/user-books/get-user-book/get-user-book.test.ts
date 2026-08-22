import { UserBookRepository } from '../../../src/modules/user-books/domain/user-book.repository';
import { GetUserBookHandler } from '../../../src/modules/user-books/features/get-user-book/get-user-book.handler';
import { GetUserBookQuery } from '../../../src/modules/user-books/features/get-user-book/get-user-book.query';
import { NotFoundException } from '@nestjs/common';

describe('GetUserBookHandler', () => {
  let handler: GetUserBookHandler;
  let repository: jest.Mocked<UserBookRepository>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserAndBook: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
    };
    handler = new GetUserBookHandler(repository);
  });

  it('returns the user book when it exists', async () => {
    const mockUserBook = {
      id: 'user-book-id',
      userId: 'user-id',
      bookId: 'book-id',
      currentPage: 80,
      lastReadAt: new Date(),
      version: 7,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    repository.findByUserAndBook.mockResolvedValue(mockUserBook as any);

    const result = await handler.execute(
      new GetUserBookQuery('user-id', 'book-id'),
    );

    expect(repository.findByUserAndBook).toHaveBeenCalledWith(
      'user-id',
      'book-id',
    );
    expect(result).toMatchObject({
      id: 'user-book-id',
      userId: 'user-id',
      bookId: 'book-id',
      currentPage: 80,
      version: 7,
    });
  });

  it('throws NotFoundException when the user book does not exist', async () => {
    repository.findByUserAndBook.mockResolvedValue(null);

    await expect(
      handler.execute(new GetUserBookQuery('user-id', 'non-existent-book')),
    ).rejects.toThrow(NotFoundException);
  });
});
