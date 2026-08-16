import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfileRepository } from '../../../domain/user-profile.repository';
import { UserProfile } from '../../../domain/user-profile';
import { UserProfileEntity } from './user-profile.entity';

/**
 * PostgreSQL (TypeORM) adapter for the user profile repository port.
 *
 * Implementations for other providers (Supabase, Firebase) can follow the
 * same shape and be bound to USER_PROFILE_REPOSITORY instead.
 */
@Injectable()
export class TypeOrmUserProfileRepository implements UserProfileRepository {
  public constructor(
    @InjectRepository(UserProfileEntity)
    private readonly repository: Repository<UserProfileEntity>,
  ) {}

  public async create(profile: UserProfile): Promise<UserProfile> {
    await this.repository.save(UserProfileEntity.fromDomain(profile));
    return profile;
  }

  public async findById(id: string): Promise<UserProfile | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? entity.toDomain() : null;
  }

  public async findByUsername(username: string): Promise<UserProfile | null> {
    const entity = await this.repository.findOne({ where: { username } });
    return entity ? entity.toDomain() : null;
  }
}
