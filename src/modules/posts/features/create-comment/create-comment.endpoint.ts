import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommentResponseDto } from '../../dto/comment.response.dto';
import { CreateCommentCommand } from './create-comment.command';
import { CreateCommentDto } from './create-comment.dto';

interface AuthenticatedRequest {
  userId?: string;
}

@ApiTags('posts')
@Controller('posts')
export class CreateCommentEndpoint {
  public constructor(private readonly commandBus: CommandBus) {}

  @Post(':id/comments')
  @ApiOperation({ summary: 'Create a comment on a post' })
  @ApiCreatedResponse({
    description: 'Comment created',
    type: CommentResponseDto,
  })
  public create(
    @Req() req: AuthenticatedRequest,
    @Param('id') postId: string,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    const userId = req.userId || '00000000-0000-0000-0000-000000000001';
    return this.commandBus.execute(
      new CreateCommentCommand(postId, userId, dto.content),
    );
  }
}
