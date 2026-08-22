import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { GetUserBookEndpoint } from '../../../src/modules/user-books/features/get-user-book/get-user-book.endpoint';
import { GetUserBookQuery } from '../../../src/modules/user-books/features/get-user-book/get-user-book.query';

describe('GetUserBookEndpoint', () => {
  let endpoint: GetUserBookEndpoint;
  let queryBus: { execute: jest.Mock };

  beforeEach(async () => {
    queryBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetUserBookEndpoint],
      providers: [{ provide: QueryBus, useValue: queryBus }],
    }).compile();

    endpoint = module.get<GetUserBookEndpoint>(GetUserBookEndpoint);
  });

  it('dispatches a GetUserBookQuery with the correct ids', async () => {
    const expectedResponse = {
      id: 'user-book-id',
      userId: 'user-id',
      bookId: 'book-id',
      currentPage: 80,
      version: 7,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    queryBus.execute.mockResolvedValue(expectedResponse);

    const result = await endpoint.getUserBook('user-id', 'book-id');

    expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetUserBookQuery));
    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-id', bookId: 'book-id' }),
    );
    expect(result).toEqual(expectedResponse);
  });
});
