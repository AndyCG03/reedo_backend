import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('app')
@Controller()
export class HealthEndpoint {
  @Get('health')
  @ApiOperation({ summary: 'Service health check' })
  public getHealth() {
    return {
      status: 'ok',
      service: 'reading-platform-api',
      timestamp: new Date().toISOString(),
    };
  }
}
