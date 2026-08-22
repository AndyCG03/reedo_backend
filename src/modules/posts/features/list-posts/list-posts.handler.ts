import type { PaginatedResult } from '../../../../common/sieve';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  POST_REPOSITORY,
  type PostRepository,
} from '../../domain/post.repository';
import { PostResponseDto } from '../../dto/post.response.dto';
import { ListPostsQuery } from './list-posts.query';

@QueryHandler(ListPostsQuery)
export class ListPostsHandler implements IQueryHandler<ListPostsQuery> {
  public constructor(
    @Inject(POST_REPOSITORY) private readonly repository: PostRepository,
  ) {}

  public async execute(
    query: ListPostsQuery,
  ): Promise<PaginatedResult<PostResponseDto>> {
    const page = await this.repository.findMany(query.query, {
      userId: query.userId,
      bookId: query.bookId,
    });
    return {
      ...page,
      data: page.data.map((enriched) => PostResponseDto.fromEnriched(enriched)),
    };
  }
}
