import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  POST_REPOSITORY,
  type PostRepository,
} from '../../domain/post.repository';
import { PostResponseDto } from '../../dto/post.response.dto';
import { GetPostQuery } from './get-post.query';

@QueryHandler(GetPostQuery)
export class GetPostHandler implements IQueryHandler<GetPostQuery> {
  public constructor(
    @Inject(POST_REPOSITORY) private readonly repository: PostRepository,
  ) {}

  public async execute(query: GetPostQuery): Promise<PostResponseDto> {
    const enriched = await this.repository.findById(query.postId);
    if (!enriched) {
      throw new NotFoundException(`Post with id "${query.postId}" not found.`);
    }
    return PostResponseDto.fromEnriched(enriched);
  }
}
