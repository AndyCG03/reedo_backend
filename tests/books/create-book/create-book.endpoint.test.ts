import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { CreateBookEndpoint } from '../../../src/modules/books/features/create-book/create-book.endpoint';
import { CreateBookCommand } from '../../../src/modules/books/features/create-book/create-book.command';
import { CreateBookDto } from '../../../src/modules/books/features/create-book/create-book.dto';

describe('CreateBookEndpoint', () => {
  let endpoint: CreateBookEndpoint;
  let commandBus: { execute: jest.Mock };

  beforeEach(async () => {
    commandBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreateBookEndpoint],
      providers: [{ provide: CommandBus, useValue: commandBus }],
    }).compile();

    endpoint = module.get<CreateBookEndpoint>(CreateBookEndpoint);
  });

  it('dispatches a CreateBookCommand with the correct data', async () => {
    const dto: CreateBookDto = { title: 'The Hobbit', totalPages: 310 };
    const expectedResponse = {
      id: 'book-id',
      title: 'The Hobbit',
      totalPages: 310,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    commandBus.execute.mockResolvedValue(expectedResponse);

    const result = await endpoint.create(dto);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreateBookCommand),
    );
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'The Hobbit',
        totalPages: 310,
      }),
    );
    expect(result).toEqual(expectedResponse);
  });
});
