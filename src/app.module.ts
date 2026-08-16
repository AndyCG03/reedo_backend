import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './common/config/app.config';
import { DatabaseModule } from './common/database/database.module';
import { RoutesModule } from './routes/routes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    DatabaseModule,
    RoutesModule,
  ],
})
export class AppModule {}
