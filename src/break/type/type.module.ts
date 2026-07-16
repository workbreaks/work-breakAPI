import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TypeController } from "./type.controller";
import { TypeService } from "./type.service";
import { TypeRepository } from "./type.repository";
import { BreaksType, BreaksTypeSchema } from "./breaks-type.schema";
import { Break, BreakSchema } from "../break.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BreaksType.name, schema: BreaksTypeSchema },
      { name: Break.name, schema: BreakSchema },
    ]),
  ],
  controllers: [TypeController],
  providers: [TypeService, TypeRepository],
  exports: [TypeService],
})
export class TypeModule {}
