import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserProfile } from '../../../domain/user-profile';

/**
 * Persistence record for the user profile slice (PostgreSQL / TypeORM).
 *
 * Mapping between this record and the domain model lives here so the rest of
 * the slice never depends on TypeORM specifics.
 */
@Entity({ name: 'user_profiles' })
export class UserProfileEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 60, name: 'display_name' })
  displayName!: string;

  @Column({ type: 'varchar', length: 280, nullable: true })
  bio!: string | null;

  @Column({ type: 'varchar', length: 500, name: 'avatar_url', nullable: true })
  avatarUrl!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  public static fromDomain(profile: UserProfile): UserProfileEntity {
    const entity = new UserProfileEntity();
    entity.id = profile.id;
    entity.username = profile.username;
    entity.displayName = profile.displayName;
    entity.bio = profile.bio;
    entity.avatarUrl = profile.avatarUrl;
    entity.createdAt = profile.createdAt;
    entity.updatedAt = profile.updatedAt;
    return entity;
  }

  public toDomain(): UserProfile {
    return new UserProfile(
      this.id,
      this.username,
      this.displayName,
      this.bio,
      this.avatarUrl,
      this.createdAt,
      this.updatedAt,
    );
  }
}
