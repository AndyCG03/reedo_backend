import { ConflictException, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { User } from '../../domain/user';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../domain/user.repository';
import { UserResponseDto } from '../../dto/user.response.dto';
import { CreateUserCommand } from './create-user.command';

/**
 * Write side of the create-user feature.
 *
 * Enforces the "username is unique" business rule before persisting the new
 * aggregate. It depends only on the UserRepository interface so the handler
 * can be unit-tested with a mock.
 */
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  public constructor(
    @Inject(USER_REPOSITORY) private readonly repository: UserRepository,
  ) {}

  public async execute(command: CreateUserCommand): Promise<UserResponseDto> {
    const existing = await this.repository.findByUsername(command.username);
    if (existing) {
      throw new ConflictException(
        `Username "${command.username}" is already taken.`,
      );
    }

    const toCreate = User.create({
      id: randomUUID(),
      username: command.username,
      email: command.email,
      bio: command.bio,
      avatarUrl: command.avatarUrl,
    });

    const user = await this.repository.create(toCreate);
    return UserResponseDto.fromDomain(user);
  }
}
