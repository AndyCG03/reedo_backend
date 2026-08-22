import { Book } from '../../../src/modules/books/domain/book';
import { BookRepository } from '../../../src/modules/books/domain/book.repository';
import { CreateBookHandler } from '../../../src/modules/books/features/create-book/create-book.handler';
import { CreateBookCommand } from '../../../src/modules/books/features/create-book/create-book.command';

describe('CreateBookHandler', () => {
  let handler: CreateBookHandler;
  let repository: jest.Mocked<BookRepository>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
    };
    handler = new CreateBookHandler(repository);
  });

  it('creates and persists a book', async () => {
    repository.create.mockImplementation((book) => Promise.resolve(book));

    const result = await handler.execute(
      new CreateBookCommand('The Hobbit', 310),
    );

    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(expect.any(Book));
    expect(result).toMatchObject({
      title: 'The Hobbit',
      totalPages: 310,
    });
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('generates a unique id for each book', async () => {
    repository.create.mockImplementation((book) => Promise.resolve(book));

    const result1 = await handler.execute(new CreateBookCommand('Book 1', 100));
    const result2 = await handler.execute(new CreateBookCommand('Book 2', 200));

    expect(result1.id).not.toBe(result2.id);
  });
});
