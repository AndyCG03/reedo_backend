import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { Comment } from '../../domain/comment';
import {
  COMMENT_REPOSITORY,
  type CommentRepository,
} from '../../domain/comment.repository';
import {
  POST_REPOSITORY,
  type PostRepository,
} from '../../domain/post.repository';
import { CommentResponseDto } from '../../dto/comment.response.dto';
import { CreateCommentCommand } from './create-comment.command';

@CommandHandler(CreateCommentCommand)
export class CreateCommentHandler implements ICommandHandler<CreateCommentCommand> {
  public constructor(
    @Inject(COMMENT_REPOSITORY)
    private readonly commentRepository: CommentRepository,
    @Inject(POST_REPOSITORY)
    private readonly postRepository: PostRepository,
  ) {}

  public async execute(
    command: CreateCommentCommand,
  ): Promise<CommentResponseDto> {
    const post = await this.postRepository.existsById(command.postId);
    if (!post) {
      throw new NotFoundException(
        `Post with id "${command.postId}" not found.`,
      );
    }

    const comment = Comment.create({
      id: randomUUID(),
      postId: command.postId,
      userId: command.userId,
      content: command.content,
    });

    await this.commentRepository.create(comment);

    const comments = await this.commentRepository.findMany(command.postId, {
      page: 1,
      pageSize: 1,
    });
    const created = comments.data[0];
    return CommentResponseDto.fromAuthorComment(created);
  }
}
