import { Controller, Delete, Param, ParseUUIDPipe, Req } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UnlikePostCommand } from './unlike-post.command';

interface AuthenticatedRequest {
  userId?: string;
}

@ApiTags('posts')
@Controller('posts')
export class UnlikePostEndpoint {
  public constructor(private readonly commandBus: CommandBus) {}

  @Delete(':id/like')
  @ApiOperation({ summary: 'Unlike a post' })
  @ApiNoContentResponse({ description: 'Post unliked' })
  public unlike(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    const userId = req.userId || '00000000-0000-0000-0000-000000000001';
    return this.commandBus.execute(new UnlikePostCommand(id, userId));
  }
}
