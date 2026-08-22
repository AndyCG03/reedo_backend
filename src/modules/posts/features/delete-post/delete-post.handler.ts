import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  POST_REPOSITORY,
  type PostRepository,
} from '../../domain/post.repository';
import { DeletePostCommand } from './delete-post.command';

@CommandHandler(DeletePostCommand)
export class DeletePostHandler implements ICommandHandler<DeletePostCommand> {
  public constructor(
    @Inject(POST_REPOSITORY) private readonly repository: PostRepository,
  ) {}

  public async execute(command: DeletePostCommand): Promise<void> {
    const enriched = await this.repository.findById(command.postId);
    if (!enriched) {
      throw new NotFoundException(
        `Post with id "${command.postId}" not found.`,
      );
    }

    if (enriched.post.userId !== command.userId) {
      throw new ForbiddenException('You can only delete your own posts.');
    }

    await this.repository.softDelete(command.postId);
  }
}
