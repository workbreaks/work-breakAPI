import { Module } from "@nestjs/common";
import { TaskController } from "./task.controller";
import { TaskService } from "./task.service";
import { TaskRepository } from "./task.repository";
import { MongooseModule } from "@nestjs/mongoose";
import { Task, TaskSchema } from "./task.schema";
import { Admin, AdminSchema } from "../admin/admin.schema";

import { GoogleCalendarModule } from "../google-calendar/google-calendar.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
    GoogleCalendarModule,
  ],
  controllers: [TaskController],
  providers: [TaskService, TaskRepository],
})
export class TaskModule {}
