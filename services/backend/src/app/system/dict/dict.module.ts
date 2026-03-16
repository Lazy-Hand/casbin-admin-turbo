import { Module } from '@nestjs/common';
import { DictService } from './dict.service';
import { DictController } from './dict.controller';

@Module({
  imports: [],
  controllers: [DictController],
  providers: [DictService],
  exports: [DictService],
})
export class DictModule {}
