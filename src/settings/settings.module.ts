import { Module } from "@nestjs/common";
import { SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";
import { SettingsRepository } from "./settings.repository";
import { MongooseModule } from "@nestjs/mongoose";
import { Break, BreakSchema } from "../break/break.schema";
import { Task, TaskSchema } from "../task/task.schema";
import { User, UserSchema } from "../user-auth/api/user/model/user.schema";
import { BreaksType, BreaksTypeSchema } from "../break/type/breaks-type.schema";
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: Break.name, schema: BreakSchema },
      { name: BreaksType.name, schema: BreaksTypeSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [SettingsController],
  providers: [SettingsService, SettingsRepository],
})
export class SettingsModule {}
