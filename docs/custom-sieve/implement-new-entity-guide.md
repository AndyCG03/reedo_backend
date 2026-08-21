# Cómo agregar una nueva entidad (ejemplo: Books)

Guía paso a paso siguiendo los patrones existentes del proyecto (Vertical Slices + CQRS + Hexagonal + PrismaSieve).

---

## Estructura final

```
prisma/
├── models/
│   ├── user.prisma        # Modelo de Prisma para User
│   └── book.prisma        # Modelo de Prisma para Book (nuevo)
└── schema.prisma          # Solo generator + datasource

src/modules/books/
├── books.module.ts
├── domain/
│   ├── book.ts
│   └── book.repository.ts
├── dto/
│   └── book.response.dto.ts
├── features/
│   ├── create-book/
│   │   ├── create-book.command.ts
│   │   ├── create-book.dto.ts
│   │   ├── create-book.handler.ts
│   │   └── create-book.endpoint.ts
│   ├── get-book/
│   │   ├── get-book.query.ts
│   │   ├── get-book.handler.ts
│   │   └── get-book.endpoint.ts
│   └── list-books/
│       ├── list-books.query.ts
│       ├── list-books.handler.ts
│       └── list-books.endpoint.ts
└── infrastructure/
    └── persistence/prisma/
        ├── book.sieve.ts
        └── prisma-book.repository.ts
```

---

## Paso 1: Schema de Prisma

Los modelos se definen en archivos separados dentro de `prisma/models/`. El archivo principal `prisma/schema.prisma` solo contiene `generator` y `datasource`.

Crear `prisma/models/book.prisma`:

```prisma
model Book {
  id        String   @id @db.Uuid
  name      String   @db.VarChar(200)
  pageCount Int      @map("page_count")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("books")
}
```

La config en `prisma.config.ts` ya apunta al directorio `./prisma`, así que Prisma automáticamenteDetecta todos los archivos `*.prisma` dentro de `prisma/` y `prisma/models/`.

Ejecutar:

```bash
npx prisma migrate dev --create-only
# revisar la migración generada
npx prisma migrate dev
npx prisma generate
```

---

## Paso 2: Domain — Entidad

Crear `src/modules/books/domain/book.ts`:

```typescript
import { TimestampedEntity } from '../../../common/domain/base-entity';

export class Book extends TimestampedEntity {
  public constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly pageCount: number,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(createdAt, updatedAt);
  }

  public static create(input: {
    id: string;
    name: string;
    pageCount: number;
  }): Book {
    const now = new Date();
    return new Book(input.id, input.name, input.pageCount, now, now);
  }
}
```

---

## Paso 3: Domain — Repository port

Crear `src/modules/books/domain/book.repository.ts`:

```typescript
import type { PaginatedResult, SieveOptions } from '../../../common/sieve';
import { Book } from './book';

export const BOOK_REPOSITORY = Symbol('BOOK_REPOSITORY');

export interface BookRepository {
  create(book: Book): Promise<Book>;
  findById(id: string): Promise<Book | null>;
  findMany(query: SieveOptions): Promise<PaginatedResult<Book>>;
}
```

Puntos clave:
- El `Symbol` es el token de DI. Nunca inyectes la clase directamente, inyecta este token.
- `findMany` acepta `SieveOptions` y retorna `PaginatedResult<Book>`.
- Solo declara los métodos que necesites. Si no necesitas `findByUsername` (como en users), no lo pongas.

---

## Paso 4: DTO de respuesta

Crear `src/modules/books/dto/book.response.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { Book } from '../domain/book';

export class BookResponseDto {
  @ApiProperty({ example: 'b3f2c9a1-...' })
  id!: string;

  @ApiProperty({ example: 'The Hobbit' })
  name!: string;

  @ApiProperty({ example: 310 })
  pageCount!: number;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt!: Date;

  public static fromDomain(book: Book): BookResponseDto {
    const dto = new BookResponseDto();
    dto.id = book.id;
    dto.name = book.name;
    dto.pageCount = book.pageCount;
    dto.createdAt = book.createdAt;
    dto.updatedAt = book.updatedAt;
    return dto;
  }
}
```

---

## Paso 5: Sieve config (whitelist)

Crear `src/modules/books/infrastructure/persistence/prisma/book.sieve.ts`:

```typescript
import { Prisma } from '@prisma/client';
import { PrismaSieveConfig } from '../../../../../common/sieve/prisma-sieve.config';

export const BookSieveConfig: PrismaSieveConfig<Prisma.BookWhereInput> = {
  name: { canFilter: true, canSort: true },
  pageCount: { canFilter: true, canSort: true },
  createdAt: { canFilter: true, canSort: true },
  updatedAt: { canFilter: true, canSort: true },
};
```

Los campos con `canFilter: true` se pueden filtrar desde el query param `filters`.
Los campos con `canSort: true` se pueden ordenar desde `sorts`.

---

## Paso 6: Repository adapter (Prisma)

Crear `src/modules/books/infrastructure/persistence/prisma/prisma-book.repository.ts`:

```typescript
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
        name: book.name,
        pageCount: book.pageCount,
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
    name: string;
    pageCount: number;
    createdAt: Date;
    updatedAt: Date;
  }): Book {
    return new Book(
      record.id,
      record.name,
      record.pageCount,
      record.createdAt,
      record.updatedAt,
    );
  }
}
```

El patrón de `findMany` es siempre el mismo: `PrismaSieve.build()` → `$transaction([findMany, count])` → mapear a dominio.

---

## Paso 7: Features — Create

### 7a. Command

Crear `src/modules/books/features/create-book/create-book.command.ts`:

```typescript
export class CreateBookCommand {
  public constructor(
    public readonly name: string,
    public readonly pageCount: number,
  ) {}
}
```

### 7b. Input DTO

Crear `src/modules/books/features/create-book/create-book.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Length, Min } from 'class-validator';

export class CreateBookDto {
  @ApiProperty({ example: 'The Hobbit', minLength: 1, maxLength: 200 })
  @IsString()
  @Length(1, 200)
  name!: string;

  @ApiProperty({ example: 310, minimum: 1 })
  @IsInt()
  @Min(1)
  pageCount!: number;
}
```

### 7c. Handler

Crear `src/modules/books/features/create-book/create-book.handler.ts`:

```typescript
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { Book } from '../../domain/book';
import {
  BOOK_REPOSITORY,
  type BookRepository,
} from '../../domain/book.repository';
import { BookResponseDto } from '../../dto/book.response.dto';
import { CreateBookCommand } from './create-book.command';

@CommandHandler(CreateBookCommand)
export class CreateBookHandler implements ICommandHandler<CreateBookCommand> {
  public constructor(
    @Inject(BOOK_REPOSITORY) private readonly repository: BookRepository,
  ) {}

  public async execute(command: CreateBookCommand): Promise<BookResponseDto> {
    const book = Book.create({
      id: randomUUID(),
      name: command.name,
      pageCount: command.pageCount,
    });

    const created = await this.repository.create(book);
    return BookResponseDto.fromDomain(created);
  }
}
```

### 7d. Endpoint

Crear `src/modules/books/features/create-book/create-book.endpoint.ts`:

```typescript
import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BookResponseDto } from '../../dto/book.response.dto';
import { CreateBookCommand } from './create-book.command';
import { CreateBookDto } from './create-book.dto';

@ApiTags('books')
@Controller('books')
export class CreateBookEndpoint {
  public constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @ApiOperation({ summary: 'Create a book' })
  @ApiCreatedResponse({ description: 'Book created', type: BookResponseDto })
  public create(@Body() dto: CreateBookDto): Promise<BookResponseDto> {
    return this.commandBus.execute(
      new CreateBookCommand(dto.name, dto.pageCount),
    );
  }
}
```

---

## Paso 8: Features — Get by ID

### 8a. Query

Crear `src/modules/books/features/get-book/get-book.query.ts`:

```typescript
export class GetBookQuery {
  public constructor(public readonly bookId: string) {}
}
```

### 8b. Handler

Crear `src/modules/books/features/get-book/get-book.handler.ts`:

```typescript
import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  BOOK_REPOSITORY,
  type BookRepository,
} from '../../domain/book.repository';
import { BookResponseDto } from '../../dto/book.response.dto';
import { GetBookQuery } from './get-book.query';

@QueryHandler(GetBookQuery)
export class GetBookHandler implements IQueryHandler<GetBookQuery> {
  public constructor(
    @Inject(BOOK_REPOSITORY) private readonly repository: BookRepository,
  ) {}

  public async execute(query: GetBookQuery): Promise<BookResponseDto> {
    const book = await this.repository.findById(query.bookId);
    if (!book) {
      throw new NotFoundException(`Book with id "${query.bookId}" not found.`);
    }
    return BookResponseDto.fromDomain(book);
  }
}
```

### 8c. Endpoint

Crear `src/modules/books/features/get-book/get-book.endpoint.ts`:

```typescript
import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BookResponseDto } from '../../dto/book.response.dto';
import { GetBookQuery } from './get-book.query';

@ApiTags('books')
@Controller('books')
export class GetBookEndpoint {
  public constructor(private readonly queryBus: QueryBus) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a book by id' })
  @ApiOkResponse({ description: 'Book found', type: BookResponseDto })
  @ApiNotFoundResponse({ description: 'Book does not exist' })
  public getBook(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BookResponseDto> {
    return this.queryBus.execute(new GetBookQuery(id));
  }
}
```

---

## Paso 9: Features — List (con Sieve)

### 9a. Query

Crear `src/modules/books/features/list-books/list-books.query.ts`:

```typescript
import type { SieveOptions } from '../../../../common/sieve/sieve-options';

export class ListBooksQuery {
  public constructor(public readonly query: SieveOptions) {}
}
```

### 9b. Handler

Crear `src/modules/books/features/list-books/list-books.handler.ts`:

```typescript
import type { PaginatedResult } from '../../../../common/sieve/sieve-options';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  BOOK_REPOSITORY,
  type BookRepository,
} from '../../domain/book.repository';
import { BookResponseDto } from '../../dto/book.response.dto';
import { ListBooksQuery } from './list-books.query';

@QueryHandler(ListBooksQuery)
export class ListBooksHandler implements IQueryHandler<ListBooksQuery> {
  public constructor(
    @Inject(BOOK_REPOSITORY) private readonly repository: BookRepository,
  ) {}

  public async execute(
    query: ListBooksQuery,
  ): Promise<PaginatedResult<BookResponseDto>> {
    const page = await this.repository.findMany(query.query);
    return {
      ...page,
      data: page.data.map((book) => BookResponseDto.fromDomain(book)),
    };
  }
}
```

### 9c. Endpoint

Crear `src/modules/books/features/list-books/list-books.endpoint.ts`:

```typescript
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Sieve } from '../../../../common/sieve/sieve.decorator';
import type { SieveOptions } from '../../../../common/sieve/sieve-options';
import { ListBooksQuery } from './list-books.query';

@ApiTags('books')
@Controller('books')
export class ListBooksEndpoint {
  public constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'List books (pagination, filtering, sorting)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'filters', required: false, type: String })
  @ApiQuery({ name: 'sorts', required: false, type: String })
  public listBooks(@Sieve() query: SieveOptions) {
    return this.queryBus.execute(new ListBooksQuery(query));
  }
}
```

---

## Paso 10: Module

Crear `src/modules/books/books.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { BOOK_REPOSITORY } from './domain/book.repository';
import { CreateBookEndpoint } from './features/create-book/create-book.endpoint';
import { CreateBookHandler } from './features/create-book/create-book.handler';
import { GetBookEndpoint } from './features/get-book/get-book.endpoint';
import { GetBookHandler } from './features/get-book/get-book.handler';
import { ListBooksEndpoint } from './features/list-books/list-books.endpoint';
import { ListBooksHandler } from './features/list-books/list-books.handler';
import { PrismaBookRepository } from './infrastructure/persistence/prisma/prisma-book.repository';

@Module({
  imports: [CqrsModule],
  controllers: [CreateBookEndpoint, GetBookEndpoint, ListBooksEndpoint],
  providers: [
    {
      provide: BOOK_REPOSITORY,
      useClass: PrismaBookRepository,
    },
    CreateBookHandler,
    GetBookHandler,
    ListBooksHandler,
  ],
})
export class BooksModule {}
```

---

## Paso 11: Registrar en RoutesModule

Editar `src/routes/routes.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { BooksModule } from '../modules/books/books.module';
import { UsersModule } from '../modules/users/users.module';
import { HealthEndpoint } from './health.endpoint';

@Module({
  imports: [UsersModule, BooksModule],
  controllers: [HealthEndpoint],
})
export class RoutesModule {}
```

---

## Tests considerados importantes

Siguiendo el patrón existente del módulo users, los tests se crean en `tests/` espejando la estructura de `src/`. Todos son unit tests (sin base de datos).

### Tests del handler de create

`tests/books/create-book/create-book.test.ts`

- Happy path: crea un libro y retorna el DTO
- Verificar que llama a `repository.create` con los datos correctos

### Tests del endpoint de create

`tests/books/create-book/create-book.endpoint.test.ts`

- Verificar que el endpoint despacha el `CreateBookCommand` con los datos del DTO
- Mockear `CommandBus`

### Tests del handler de get

`tests/books/get-book/get-book.test.ts`

- Happy path: retorna el DTO cuando el libro existe
- Lanza `NotFoundException` cuando no existe

### Tests del endpoint de get

`tests/books/get-book/get-book.endpoint.test.ts`

- Verificar que despacha `GetBookQuery` con el id correcto

### Tests del handler de list

`tests/books/list-books/list-books.test.ts`

- Happy path: retorna envelope paginado con DTOs mapeados
- Verificar que llama a `repository.findMany` con los SieveOptions

### Tests del endpoint de list

`tests/books/list-books/list-books.endpoint.test.ts`

- Verificar que despacha `ListBooksQuery` con las SieveOptions

### Tests del repository

`tests/books/repository/prisma-book.repository.test.ts`

- create: verifica que llama a `prisma.book.create`
- findById: retorna el dominio cuando existe, null cuando no
- findMany: verifica que llama a `$transaction` y retorna el envelope

### Tests del sieve config

No es estrictamente necesario testear el config en sí (es solo declarativo), pero si quieres validar que los campos están bien declarados:

```typescript
import { BookSieveConfig } from '../../../src/modules/books/infrastructure/persistence/prisma/book.sieve';

describe('BookSieveConfig', () => {
  it('has name as filterable and sortable', () => {
    expect(BookSieveConfig.name).toEqual({
      canFilter: true,
      canSort: true,
    });
  });

  it('has pageCount as filterable and sortable', () => {
    expect(BookSieveConfig.pageCount).toEqual({
      canFilter: true,
      canSort: true,
    });
  });
});
```

### Resumen de tests por feature

| Feature | Handler test | Endpoint test |
|---|---|---|
| create-book | Happy path | Despacha command |
| get-book | Happy path + NotFound | Despacha query |
| list-books | Happy path envelope | Despacha query |
| repository | create/findById/findMany | — |
| sieve config | (opcional) Validación de campos | — |

---

## Checklist completo

- [ ] `prisma/models/book.prisma` — Modelo agregado + migrate + generate
- [ ] `domain/book.ts` — Entidad que extiende `TimestampedEntity`
- [ ] `domain/book.repository.ts` — Interface + Symbol token
- [ ] `dto/book.response.dto.ts` — DTO con `fromDomain()` y decoradores Swagger
- [ ] `infrastructure/.../book.sieve.ts` — Whitelist de campos filtrables/sorteables
- [ ] `infrastructure/.../prisma-book.repository.ts` — Adapter con `PrismaSieve.build()`
- [ ] `features/create-book/` — Command, DTO, Handler, Endpoint
- [ ] `features/get-book/` — Query, Handler, Endpoint
- [ ] `features/list-books/` — Query, Handler, Endpoint (con `@Sieve()`)
- [ ] `books.module.ts` — wiring de CQRS, handlers, controllers, DI
- [ ] `routes/routes.module.ts` — Import de `BooksModule`
- [ ] Tests en `tests/books/`
- [ ] `npx jest --no-coverage` pasa
- [ ] `npm run build` compila sin errores
