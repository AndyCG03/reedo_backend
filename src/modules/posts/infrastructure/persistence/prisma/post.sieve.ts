import { Prisma } from '@prisma/client';
import { PrismaSieveConfig } from '../../../../../common/sieve/prisma-sieve.config';

export const PostSieveConfig: PrismaSieveConfig<Prisma.PostWhereInput> = {
  content: { canFilter: true, canSort: false },
  userId: { canFilter: true, canSort: false },
  bookId: { canFilter: true, canSort: false },
  createdAt: { canFilter: true, canSort: true },
  updatedAt: { canFilter: true, canSort: true },
};
