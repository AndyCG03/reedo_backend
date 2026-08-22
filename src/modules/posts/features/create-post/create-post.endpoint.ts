import { Body, Controller, Post, Req } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PostResponseDto } from '../../dto/post.response.dto';
import { CreatePostCommand } from './create-post.command';
import { CreatePostDto } from './create-post.dto';

interface AuthenticatedRequest {
  userId?: string;
}

@ApiTags('posts')
@Controller('posts')
export class CreatePostEndpoint {
  public constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @ApiOperation({ summary: 'Create a post' })
  @ApiCreatedResponse({
    description: 'Post created successfully',
    type: PostResponseDto,
  })
  public create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreatePostDto,
  ): Promise<PostResponseDto> {
    const userId = req.userId || '00000000-0000-0000-0000-000000000001';
    return this.commandBus.execute(
      new CreatePostCommand(userId, dto.content, dto.bookId),
    );
  }
}
