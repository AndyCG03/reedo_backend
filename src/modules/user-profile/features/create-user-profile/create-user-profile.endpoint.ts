import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserProfileResponseDto } from '../../dto/user-profile.response.dto';
import { CreateUserProfileCommand } from './create-user-profile.command';
import { CreateUserProfileDto } from './create-user-profile.dto';

/**
 * HTTP endpoint (POST /user-profile) for the create-user-profile feature.
 *
 * It is intentionally thin: it maps the HTTP request to a command and leaves
 * all logic to the command handler.
 */
@ApiTags('user-profile')
@Controller('user-profile')
export class CreateUserProfileEndpoint {
  public constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @ApiOperation({ summary: 'Create a user profile' })
  @ApiCreatedResponse({
    description: 'Profile created successfully',
    type: UserProfileResponseDto,
  })
  public create(
    @Body() dto: CreateUserProfileDto,
  ): Promise<UserProfileResponseDto> {
    return this.commandBus.execute(
      new CreateUserProfileCommand(
        dto.username,
        dto.displayName,
        dto.bio,
        dto.avatarUrl,
      ),
    );
  }
}
