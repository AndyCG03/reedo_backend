import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  POST_LIKE_REPOSITORY,
  type PostLikeRepository,
} from '../../domain/post-like.repository';
import {
  POST_REPOSITORY,
  type PostRepository,
} from '../../domain/post.repository';
import { UnlikePostCommand } from './unlike-post.command';

@CommandHandler(UnlikePostCommand)
export class UnlikePostHandler implements ICommandHandler<UnlikePostCommand> {
  public constructor(
    @Inject(POST_LIKE_REPOSITORY)
    private readonly likeRepository: PostLikeRepository,
    @Inject(POST_REPOSITORY)
    private readonly postRepository: PostRepository,
  ) {}

  public async execute(command: UnlikePostCommand): Promise<void> {
    const post = await this.postRepository.existsById(command.postId);
    if (!post) {
      throw new NotFoundException(
        `Post with id "${command.postId}" not found.`,
      );
    }

    await this.likeRepository.delete(command.postId, command.userId);
  }
}
