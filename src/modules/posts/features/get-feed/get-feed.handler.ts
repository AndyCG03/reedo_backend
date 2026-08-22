import type { PaginatedResult } from '../../../../common/sieve';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  POST_REPOSITORY,
  type PostRepository,
} from '../../domain/post.repository';
import { PostResponseDto } from '../../dto/post.response.dto';
import { GetFeedQuery } from './get-feed.query';

@QueryHandler(GetFeedQuery)
export class GetFeedHandler implements IQueryHandler<GetFeedQuery> {
  public constructor(
    @Inject(POST_REPOSITORY) private readonly repository: PostRepository,
  ) {}

  public async execute(
    query: GetFeedQuery,
  ): Promise<PaginatedResult<PostResponseDto>> {
    const page = await this.repository.findMany(query.query);
    return {
      ...page,
      data: page.data.map((enriched) => PostResponseDto.fromEnriched(enriched)),
    };
  }
}
