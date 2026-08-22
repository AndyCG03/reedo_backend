import { UserBookRepository } from '../../../src/modules/user-books/domain/user-book.repository';
import { ListUserBooksHandler } from '../../../src/modules/user-books/features/list-user-books/list-user-books.handler';
import { ListUserBooksQuery } from '../../../src/modules/user-books/features/list-user-books/list-user-books.query';

describe('ListUserBooksHandler', () => {
  let handler: ListUserBooksHandler;
  let repository: jest.Mocked<UserBookRepository>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserAndBook: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
    };
    handler = new ListUserBooksHandler(repository);
  });

  it('returns a paginated list of user books', async () => {
    const mockUserBooks = [
      {
        id: 'user-book-1',
        userId: 'user-id',
        bookId: 'book-1',
        currentPage: 80,
        lastReadAt: new Date(),
        version: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-book-2',
        userId: 'user-id',
        bookId: 'book-2',
        currentPage: 150,
        lastReadAt: new Date(),
        version: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockResult = {
      data: mockUserBooks,
      meta: {
        total: 2,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        lastPage: 1,
      },
    };

    repository.findByUserId.mockResolvedValue(mockResult as any);

    const query = { page: 1, pageSize: 20, filters: '', sorts: '' };
    const result = await handler.execute(
      new ListUserBooksQuery('user-id', query as any),
    );

    expect(repository.findByUserId).toHaveBeenCalledWith('user-id', query);
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toMatchObject({
      id: 'user-book-1',
      currentPage: 80,
    });
    expect(result.data[1]).toMatchObject({
      id: 'user-book-2',
      currentPage: 150,
    });
    expect(result.meta).toEqual(mockResult.meta);
  });
});
