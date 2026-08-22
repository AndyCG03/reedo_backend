import { Controller, Delete, Param, Req } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DeleteCommentCommand } from './delete-comment.command';

interface AuthenticatedRequest {
  userId?: string;
}

@ApiTags('comments')
@Controller('comments')
export class DeleteCommentEndpoint {
  public constructor(private readonly commandBus: CommandBus) {}

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a comment (soft delete)' })
  @ApiNoContentResponse({ description: 'Comment deleted' })
  @ApiNotFoundResponse({ description: 'Comment does not exist' })
  public delete(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<void> {
    const userId = req.userId || '00000000-0000-0000-0000-000000000001';
    return this.commandBus.execute(new DeleteCommentCommand(id, userId));
  }
}
