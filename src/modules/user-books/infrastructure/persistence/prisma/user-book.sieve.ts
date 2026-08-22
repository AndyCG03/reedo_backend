import { Prisma } from '@prisma/client';
import { PrismaSieveConfig } from '../../../../../common/sieve/prisma-sieve.config';

export const UserBookSieveConfig: PrismaSieveConfig<Prisma.UserBookWhereInput> =
  {
    userId: { canFilter: true, canSort: false },
    bookId: { canFilter: true, canSort: false },
    currentPage: { canFilter: true, canSort: true },
    lastReadAt: { canFilter: true, canSort: true },
    version: { canFilter: true, canSort: true },
    createdAt: { canFilter: true, canSort: true },
    updatedAt: { canFilter: true, canSort: true },
  };
