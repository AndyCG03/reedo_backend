import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  COMMENT_REPOSITORY,
  type CommentRepository,
} from '../../domain/comment.repository';
import { CommentResponseDto } from '../../dto/comment.response.dto';
import { UpdateCommentCommand } from './update-comment.command';

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentHandler implements ICommandHandler<UpdateCommentCommand> {
  public constructor(
    @Inject(COMMENT_REPOSITORY)
    private readonly commentRepository: CommentRepository,
  ) {}

  public async execute(
    command: UpdateCommentCommand,
  ): Promise<CommentResponseDto> {
    const existing = await this.commentRepository.findById(command.commentId);
    if (!existing) {
      throw new NotFoundException(
        `Comment with id "${command.commentId}" not found.`,
      );
    }

    if (existing.userId !== command.userId) {
      throw new ForbiddenException('You can only update your own comments.');
    }

    const updated = await this.commentRepository.update(command.commentId, {
      content: command.content,
    });

    return CommentResponseDto.fromComment(updated);
  }
}
