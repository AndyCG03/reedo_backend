import { Prisma } from '@prisma/client';
import { PrismaSieveConfig } from '../../../../../common/sieve/prisma-sieve.config';

export const BookSieveConfig: PrismaSieveConfig<Prisma.BookWhereInput> = {
  title: { canFilter: true, canSort: true },
  totalPages: { canFilter: true, canSort: true },
  createdAt: { canFilter: true, canSort: true },
  updatedAt: { canFilter: true, canSort: true },
};
