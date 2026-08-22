import { Controller, Get, Param, ParseUUIDPipe, Req } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PostResponseDto } from '../../dto/post.response.dto';
import { GetPostQuery } from './get-post.query';

interface AuthenticatedRequest {
  userId?: string;
}

@ApiTags('posts')
@Controller('posts')
export class GetPostEndpoint {
  public constructor(private readonly queryBus: QueryBus) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a post by id' })
  @ApiOkResponse({ description: 'Post found', type: PostResponseDto })
  @ApiNotFoundResponse({ description: 'Post does not exist' })
  public getPost(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PostResponseDto> {
    const userId = req.userId || '00000000-0000-0000-0000-000000000001';
    return this.queryBus.execute(new GetPostQuery(id, userId));
  }
}
