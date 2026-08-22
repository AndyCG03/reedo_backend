import { Body, Controller, Param, Patch, Req } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CommentResponseDto } from '../../dto/comment.response.dto';
import { UpdateCommentCommand } from './update-comment.command';
import { UpdateCommentDto } from './update-comment.dto';

interface AuthenticatedRequest {
  userId?: string;
}

@ApiTags('comments')
@Controller('comments')
export class UpdateCommentEndpoint {
  public constructor(private readonly commandBus: CommandBus) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiOkResponse({ description: 'Comment updated', type: CommentResponseDto })
  @ApiNotFoundResponse({ description: 'Comment does not exist' })
  public update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    const userId = req.userId || '00000000-0000-0000-0000-000000000001';
    return this.commandBus.execute(
      new UpdateCommentCommand(id, userId, dto.content),
    );
  }
}
