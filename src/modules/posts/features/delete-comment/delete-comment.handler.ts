import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  COMMENT_REPOSITORY,
  type CommentRepository,
} from '../../domain/comment.repository';
import { DeleteCommentCommand } from './delete-comment.command';

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentHandler implements ICommandHandler<DeleteCommentCommand> {
  public constructor(
    @Inject(COMMENT_REPOSITORY)
    private readonly commentRepository: CommentRepository,
  ) {}

  public async execute(command: DeleteCommentCommand): Promise<void> {
    const existing = await this.commentRepository.findById(command.commentId);
    if (!existing) {
      throw new NotFoundException(
        `Comment with id "${command.commentId}" not found.`,
      );
    }

    if (existing.userId !== command.userId) {
      throw new ForbiddenException('You can only delete your own comments.');
    }

    await this.commentRepository.softDelete(command.commentId);
  }
}
