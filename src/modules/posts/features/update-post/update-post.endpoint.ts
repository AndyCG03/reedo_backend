import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PostResponseDto } from '../../dto/post.response.dto';
import { UpdatePostCommand } from './update-post.command';
import { UpdatePostDto } from './update-post.dto';

interface AuthenticatedRequest {
  userId?: string;
}

@ApiTags('posts')
@Controller('posts')
export class UpdatePostEndpoint {
  public constructor(private readonly commandBus: CommandBus) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Update a post' })
  @ApiOkResponse({ description: 'Post updated', type: PostResponseDto })
  @ApiNotFoundResponse({ description: 'Post does not exist' })
  public update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    const userId = req.userId || '00000000-0000-0000-0000-000000000001';
    return this.commandBus.execute(
      new UpdatePostCommand(id, userId, dto.content),
    );
  }
}
