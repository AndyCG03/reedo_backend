import { NotFoundException } from '@nestjs/common';
import { BookRepository } from '../../../src/modules/books/domain/book.repository';
import { GetBookHandler } from '../../../src/modules/books/features/get-book/get-book.handler';
import { GetBookQuery } from '../../../src/modules/books/features/get-book/get-book.query';

describe('GetBookHandler', () => {
  let handler: GetBookHandler;
  let repository: jest.Mocked<BookRepository>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
    };
    handler = new GetBookHandler(repository);
  });

  it('returns the book when it exists', async () => {
    const mockBook = {
      id: 'book-id',
      title: 'The Hobbit',
      totalPages: 310,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    repository.findById.mockResolvedValue(mockBook);

    const result = await handler.execute(new GetBookQuery('book-id'));

    expect(repository.findById).toHaveBeenCalledWith('book-id');
    expect(result).toMatchObject({
      id: 'book-id',
      title: 'The Hobbit',
      totalPages: 310,
    });
  });

  it('throws NotFoundException when the book does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new GetBookQuery('non-existent-id')),
    ).rejects.toThrow(NotFoundException);
  });
});
