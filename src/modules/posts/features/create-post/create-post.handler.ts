import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { Post } from '../../domain/post';
import {
  POST_REPOSITORY,
  type PostRepository,
} from '../../domain/post.repository';
import { PostResponseDto } from '../../dto/post.response.dto';
import { CreatePostCommand } from './create-post.command';

@CommandHandler(CreatePostCommand)
export class CreatePostHandler implements ICommandHandler<CreatePostCommand> {
  public constructor(
    @Inject(POST_REPOSITORY) private readonly repository: PostRepository,
  ) {}

  public async execute(command: CreatePostCommand): Promise<PostResponseDto> {
    const post = Post.create({
      id: randomUUID(),
      userId: command.userId,
      bookId: command.bookId,
      content: command.content,
    });

    const created = await this.repository.create(post);
    const enriched = await this.repository.findById(created.id);
    return PostResponseDto.fromEnriched(enriched!);
  }
}
