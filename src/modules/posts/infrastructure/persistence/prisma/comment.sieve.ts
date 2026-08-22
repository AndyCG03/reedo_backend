import { Prisma } from '@prisma/client';
import { PrismaSieveConfig } from '../../../../../common/sieve/prisma-sieve.config';

export const CommentSieveConfig: PrismaSieveConfig<Prisma.CommentWhereInput> = {
  content: { canFilter: false, canSort: false },
  userId: { canFilter: true, canSort: false },
  postId: { canFilter: true, canSort: false },
  createdAt: { canFilter: true, canSort: true },
  updatedAt: { canFilter: true, canSort: true },
};
