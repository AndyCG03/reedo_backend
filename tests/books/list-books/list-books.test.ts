import { BookRepository } from '../../../src/modules/books/domain/book.repository';
import { ListBooksHandler } from '../../../src/modules/books/features/list-books/list-books.handler';
import { ListBooksQuery } from '../../../src/modules/books/features/list-books/list-books.query';

describe('ListBooksHandler', () => {
  let handler: ListBooksHandler;
  let repository: jest.Mocked<BookRepository>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
    };
    handler = new ListBooksHandler(repository);
  });

  it('returns a paginated list of books', async () => {
    const mockBooks = [
      {
        id: 'book-1',
        title: 'The Hobbit',
        totalPages: 310,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'book-2',
        title: 'The Lord of the Rings',
        totalPages: 1178,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockResult = {
      data: mockBooks,
      meta: {
        total: 2,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        lastPage: 1,
      },
    };

    repository.findMany.mockResolvedValue(mockResult);

    const query = { page: 1, pageSize: 20, filters: '', sorts: '' };
    const result = await handler.execute(new ListBooksQuery(query as any));

    expect(repository.findMany).toHaveBeenCalledWith(query);
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toMatchObject({ id: 'book-1', title: 'The Hobbit' });
    expect(result.data[1]).toMatchObject({
      id: 'book-2',
      title: 'The Lord of the Rings',
    });
    expect(result.meta).toEqual(mockResult.meta);
  });
});
