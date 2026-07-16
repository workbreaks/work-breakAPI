import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "./user-auth/api/user/user.module";
import { AuthModule } from "./user-auth/api/auth/auth.module";
import { BreakModule } from "./break/break.module";
import { TypeModule } from "./break/type/type.module";
import { TaskModule } from "./task/task.module";
import { ContactUsModule } from "./contactUs/contact-us.module";
import { LeavesModule } from "./leaves/leaves.module";
import { AssistantModule } from "./chat-bot/assistant.module";
import { CheckListModule } from "./daily-checklist/daily-checklist.module";
import { AdminModule } from "./admin/admin.module";
import { SettingsModule } from "./settings/settings.module";
import { mongoConfig } from "./mongodb.config";
import { MeetingModule } from "./meeting/meeting.module";
import { GoogleCalendarModule } from "./google-calendar/google-calendar.module";
@Module({
  imports: [
    MongooseModule.forRoot(mongoConfig.url, {
      autoIndex: true,
    }),
    UserModule,
    AuthModule,
    BreakModule,
    TaskModule,
    TypeModule,
    SettingsModule,
    ContactUsModule,
    LeavesModule,
    AssistantModule,
    CheckListModule,
    AdminModule,
    MeetingModule,
    GoogleCalendarModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
