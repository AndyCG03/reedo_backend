import { Controller, Param, ParseUUIDPipe, Post, Req } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LikePostCommand } from './like-post.command';

interface AuthenticatedRequest {
  userId?: string;
}

@ApiTags('posts')
@Controller('posts')
export class LikePostEndpoint {
  public constructor(private readonly commandBus: CommandBus) {}

  @Post(':id/like')
  @ApiOperation({ summary: 'Like a post' })
  @ApiNoContentResponse({ description: 'Post liked' })
  public like(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    const userId = req.userId || '00000000-0000-0000-0000-000000000001';
    return this.commandBus.execute(new LikePostCommand(id, userId));
  }
}
