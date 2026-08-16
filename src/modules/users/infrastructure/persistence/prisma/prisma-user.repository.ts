import { Injectable } from '@nestjs/common';
import {
  paginate,
  type CursorPaginated,
  type Paginated,
  type PaginateQuery,
} from '@nestarc/pagination';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { User } from '../../../domain/user';
import type { UserRepository } from '../../../domain/user.repository';

/**
 * PostgreSQL (Prisma) adapter for the user repository port.
 *
 * Implements the same UserRepository interface the former TypeORM adapter
 * did, so the domain and application layers never change.
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
      },
    });
    return user;
  }

  public async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  public async findByUsername(username: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { username } });
    return record ? this.toDomain(record) : null;
  }

  public async findMany(
    query: PaginateQuery,
  ): Promise<Paginated<User> | CursorPaginated<User>> {
    // Column/operator whitelist kept here on the adapter: it references Prisma
    // column names and is the persistence detail the handler never sees.
    const result = await paginate(query, this.prisma.user, {
      sortableColumns: ['id', 'username', 'email', 'createdAt', 'updatedAt'],
      defaultSortBy: [['createdAt', 'DESC']],
      searchableColumns: ['username', 'email'],
      filterableColumns: {
        username: ['$eq', '$ne', '$ilike', '$in', '$nin'],
        email: ['$eq', '$ne', '$ilike', '$in', '$nin', '$null', '$not:null'],
        bio: ['$eq', '$ne', '$ilike', '$null', '$not:null'],
        createdAt: ['$gt', '$gte', '$lt', '$lte', '$btw', '$null', '$not:null'],
        updatedAt: ['$gt', '$gte', '$lt', '$lte', '$btw', '$null', '$not:null'],
      },
    });
    return {
      ...result,
      data: result.data.map((record) => this.toDomain(record)),
    };
  }

  private toDomain(record: {
    id: string;
    username: string;
    email: string | null;
    bio: string | null;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User(
      record.id,
      record.username,
      record.email,
      record.bio,
      record.avatarUrl,
      record.createdAt,
      record.updatedAt,
    );
  }
}
