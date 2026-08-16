import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserResponseDto } from '../../dto/user.response.dto';
import { CreateUserCommand } from './create-user.command';
import { CreateUserDto } from './create-user.dto';

/**
 * HTTP endpoint (POST /users) for the create-user feature.
 *
 * It is intentionally thin: it maps the HTTP request to a command and leaves
 * all logic to the command handler.
 */
@ApiTags('users')
@Controller('users')
export class CreateUserEndpoint {
  public constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @ApiOperation({ summary: 'Create a user' })
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: UserResponseDto,
  })
  public create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.commandBus.execute(
      new CreateUserCommand(dto.username, dto.email, dto.bio, dto.avatarUrl),
    );
  }
}
