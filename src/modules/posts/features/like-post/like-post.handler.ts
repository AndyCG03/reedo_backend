import { ConflictException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { PostLike } from '../../domain/post-like';
import {
  POST_LIKE_REPOSITORY,
  type PostLikeRepository,
} from '../../domain/post-like.repository';
import {
  POST_REPOSITORY,
  type PostRepository,
} from '../../domain/post.repository';
import { LikePostCommand } from './like-post.command';

@CommandHandler(LikePostCommand)
export class LikePostHandler implements ICommandHandler<LikePostCommand> {
  public constructor(
    @Inject(POST_LIKE_REPOSITORY)
    private readonly likeRepository: PostLikeRepository,
    @Inject(POST_REPOSITORY)
    private readonly postRepository: PostRepository,
  ) {}

  public async execute(command: LikePostCommand): Promise<void> {
    const post = await this.postRepository.existsById(command.postId);
    if (!post) {
      throw new NotFoundException(
        `Post with id "${command.postId}" not found.`,
      );
    }

    const existing = await this.likeRepository.existsByPostAndUser(
      command.postId,
      command.userId,
    );
    if (existing) {
      throw new ConflictException('You have already liked this post.');
    }

    const like = PostLike.create({
      id: randomUUID(),
      postId: command.postId,
      userId: command.userId,
    });

    await this.likeRepository.create(like);
  }
}
