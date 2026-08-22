import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  POST_REPOSITORY,
  type PostRepository,
} from '../../domain/post.repository';
import { PostResponseDto } from '../../dto/post.response.dto';
import { UpdatePostCommand } from './update-post.command';

@CommandHandler(UpdatePostCommand)
export class UpdatePostHandler implements ICommandHandler<UpdatePostCommand> {
  public constructor(
    @Inject(POST_REPOSITORY) private readonly repository: PostRepository,
  ) {}

  public async execute(command: UpdatePostCommand): Promise<PostResponseDto> {
    const enriched = await this.repository.findById(command.postId);
    if (!enriched) {
      throw new NotFoundException(
        `Post with id "${command.postId}" not found.`,
      );
    }

    if (enriched.post.userId !== command.userId) {
      throw new ForbiddenException('You can only update your own posts.');
    }

    const updated = await this.repository.update(command.postId, {
      content: command.content,
    });

    const reEnriched = await this.repository.findById(updated.id);
    return PostResponseDto.fromEnriched(reEnriched!);
  }
}
