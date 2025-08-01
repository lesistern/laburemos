import { Module } from '@nestjs/common';
import { NdaController } from './nda.controller';
import { NdaService } from './nda.service';
import { DatabaseModule } from '../common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [NdaController],
  providers: [NdaService],
  exports: [NdaService]
})
export class NdaModule {}