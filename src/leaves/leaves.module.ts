import { Module } from "@nestjs/common";
import { LeavesController } from "./leaves.controller";
import { LeavesService } from "./leaves.service";
import { LeavesRepository } from "./leaves.repository";
import { MongooseModule } from "@nestjs/mongoose";
import { Leaves, LeavesSchema } from "./leaves.schema";
import { Admin, AdminSchema } from "../admin/admin.schema";
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Leaves.name, schema: LeavesSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
  ],
  controllers: [LeavesController],
  providers: [LeavesService, LeavesRepository],
})
export class LeavesModule {}