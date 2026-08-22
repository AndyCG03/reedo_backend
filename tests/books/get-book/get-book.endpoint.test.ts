import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { GetBookEndpoint } from '../../../src/modules/books/features/get-book/get-book.endpoint';
import { GetBookQuery } from '../../../src/modules/books/features/get-book/get-book.query';

describe('GetBookEndpoint', () => {
  let endpoint: GetBookEndpoint;
  let queryBus: { execute: jest.Mock };

  beforeEach(async () => {
    queryBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetBookEndpoint],
      providers: [{ provide: QueryBus, useValue: queryBus }],
    }).compile();

    endpoint = module.get<GetBookEndpoint>(GetBookEndpoint);
  });

  it('dispatches a GetBookQuery with the correct id', async () => {
    const expectedResponse = {
      id: 'book-id',
      title: 'The Hobbit',
      totalPages: 310,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    queryBus.execute.mockResolvedValue(expectedResponse);

    const result = await endpoint.getBook('book-id');

    expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetBookQuery));
    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ bookId: 'book-id' }),
    );
    expect(result).toEqual(expectedResponse);
  });
});
