import type { PaginatedResult } from '../../../../common/sieve';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  COMMENT_REPOSITORY,
  type CommentRepository,
} from '../../domain/comment.repository';
import { CommentResponseDto } from '../../dto/comment.response.dto';
import { ListCommentsQuery } from './list-comments.query';

@QueryHandler(ListCommentsQuery)
export class ListCommentsHandler implements IQueryHandler<ListCommentsQuery> {
  public constructor(
    @Inject(COMMENT_REPOSITORY)
    private readonly commentRepository: CommentRepository,
  ) {}

  public async execute(
    query: ListCommentsQuery,
  ): Promise<PaginatedResult<CommentResponseDto>> {
    const page = await this.commentRepository.findMany(
      query.postId,
      query.query,
    );
    return {
      ...page,
      data: page.data.map((enriched) =>
        CommentResponseDto.fromAuthorComment(enriched),
      ),
    };
  }
}
