import { Controller, Delete, Param, ParseUUIDPipe, Req } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DeletePostCommand } from './delete-post.command';

interface AuthenticatedRequest {
  userId?: string;
}

@ApiTags('posts')
@Controller('posts')
export class DeletePostEndpoint {
  public constructor(private readonly commandBus: CommandBus) {}

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post (soft delete)' })
  @ApiNoContentResponse({ description: 'Post deleted' })
  @ApiNotFoundResponse({ description: 'Post does not exist' })
  public delete(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    const userId = req.userId || '00000000-0000-0000-0000-000000000001';
    return this.commandBus.execute(new DeletePostCommand(id, userId));
  }
}
