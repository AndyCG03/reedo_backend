import { Prisma } from '@prisma/client';

import { PrismaSieveConfig } from '../../../../../common/sieve/prisma-sieve.config';
export const UserSieveConfig: PrismaSieveConfig<Prisma.UserWhereInput> = {
  username: { canFilter: true, canSort: true },
  email: { canFilter: true, canSort: true },
  bio: { canFilter: true, canSort: false },
  createdAt: { canFilter: true, canSort: true },
  updatedAt: { canFilter: true, canSort: true },
};
