import { Module } from "@nestjs/common";
import { MeetingController } from "./meeting.controller";
import { MeetingService } from "./meeting.service";
import { MeetingRepository } from "./meeting.repository";
import { MongooseModule } from "@nestjs/mongoose";
import { Meeting, MeetingSchema } from "./meeting.schema";
import { Admin, AdminSchema } from "../admin/admin.schema";

import { GoogleCalendarModule } from "../google-calendar/google-calendar.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Meeting.name, schema: MeetingSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
    GoogleCalendarModule,
  ],
  controllers: [MeetingController],
  providers: [MeetingService, MeetingRepository],
})
export class MeetingModule {}
