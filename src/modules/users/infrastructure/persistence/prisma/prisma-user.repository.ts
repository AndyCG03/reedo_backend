import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { User, UserRole } from '../../../domain/user';
import type { UserRepository } from '../../../domain/user.repository';
import type {
  PaginatedResult,
  SieveOptions,
} from '../../../../../common/sieve/sieve-options';
import { PrismaSieve } from '../../../../../common/sieve/prisma-sieve';
import { UserSieveConfig } from './user.sieve';

/**
 * PostgreSQL (Prisma) adapter for the user repository port.
 */
@Injectable()
export class PrismaUserRepository implements UserRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public async create(user: User): Promise<User> {
    await this.prisma.user.create({
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        passwordHash: user.passwordHash,
        role: user.role,
      },
    });
    return user;
  }

  public async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  public async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findFirst({ where: { email } });
    return record ? this.toDomain(record) : null;
  }

  public async findByUsername(username: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { username } });
    return record ? this.toDomain(record) : null;
  }

  public async findMany(sieve: SieveOptions): Promise<PaginatedResult<User>> {
    const { where, orderBy, skip, take } = PrismaSieve.build(
      sieve,
      UserSieveConfig,
    );

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, orderBy, skip, take }),
      this.prisma.user.count({ where }),
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
    username: string;
    email: string | null;
    bio: string | null;
    avatarUrl: string | null;
    passwordHash: string | null;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User(
      record.id,
      record.username,
      record.email,
      record.bio,
      record.avatarUrl,
      record.passwordHash,
      record.role as UserRole,
      record.createdAt,
      record.updatedAt,
    );
  }
}
