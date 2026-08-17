import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { UserProfileRepository } from '../../../domain/user-profile.repository';
import { UserProfile } from '../../../domain/user-profile';

/**
 * PostgreSQL (Prisma) adapter for the user profile repository port.
 *
 * Implements the same UserProfileRepository interface the former TypeORM
 * adapter did, so the domain and application layers never change.
 */
@Injectable()
export class PrismaUserProfileRepository implements UserProfileRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public async create(profile: UserProfile): Promise<UserProfile> {
    await this.prisma.userProfile.create({
      data: {
        id: profile.id,
        username: profile.username,
        displayName: profile.displayName,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
      },
    });
    return profile;
  }

  public async findById(id: string): Promise<UserProfile | null> {
    const record = await this.prisma.userProfile.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  public async findByUsername(username: string): Promise<UserProfile | null> {
    const record = await this.prisma.userProfile.findUnique({
      where: { username },
    });
    return record ? this.toDomain(record) : null;
  }

  private toDomain(record: {
    id: string;
    username: string;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserProfile {
    return new UserProfile(
      record.id,
      record.username,
      record.displayName,
      record.bio,
      record.avatarUrl,
      record.createdAt,
      record.updatedAt,
    );
  }
}
