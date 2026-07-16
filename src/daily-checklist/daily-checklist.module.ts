import { Module } from "@nestjs/common";
import { CheckListController } from "./daily-checklist.controller";
import { CheckListService } from "./daily-checklist.service";
import { CheckListRepository } from "./daily-checklist.repository";
import { MongooseModule } from "@nestjs/mongoose";
import { CheckList, CheckListSchema } from "./daily-checklist.schema";
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CheckList.name, schema: CheckListSchema },
    ]),
  ],
  controllers: [CheckListController],
  providers: [CheckListService, CheckListRepository],
})
export class CheckListModule {}
