import { Inject, ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { UserProfile } from '../../domain/user-profile';
import {
  USER_PROFILE_REPOSITORY,
  type UserProfileRepository,
} from '../../domain/user-profile.repository';
import { UserProfileResponseDto } from '../../dto/user-profile.response.dto';
import { CreateUserProfileCommand } from './create-user-profile.command';

/**
 * Write side of the create-user-profile feature.
 *
 * Enforces the "username is unique" business rule before persisting the new
 * aggregate. It depends only on the UserProfileRepository interface so the
 * handler can be unit-tested with a mock.
 */
@CommandHandler(CreateUserProfileCommand)
export class CreateUserProfileHandler implements ICommandHandler<CreateUserProfileCommand> {
  public constructor(
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly repository: UserProfileRepository,
  ) {}

  public async execute(
    command: CreateUserProfileCommand,
  ): Promise<UserProfileResponseDto> {
    const existing = await this.repository.findByUsername(command.username);
    if (existing) {
      throw new ConflictException(
        `Username "${command.username}" is already taken.`,
      );
    }

    const toCreate = UserProfile.create({
      id: randomUUID(),
      username: command.username,
      displayName: command.displayName,
      bio: command.bio,
      avatarUrl: command.avatarUrl,
    });

    const profile = await this.repository.create(toCreate);
    return UserProfileResponseDto.fromDomain(profile);
  }
}
