import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './common/config/app.config';
import { PrismaModule } from './prisma/prisma.module';
import { RoutesModule } from './routes/routes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    PrismaModule,
    RoutesModule,
  ],
})
export class AppModule {}
