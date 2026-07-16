import { Module } from "@nestjs/common";
import { BreakController } from "./break.controller";
import { BreakService } from "./break.service";
import { BreakRepository } from "./break.repository";
import { MongooseModule } from "@nestjs/mongoose";
import { Break, BreakSchema } from "./break.schema";
import { Admin, AdminSchema } from "../admin/admin.schema";
import { UserModule } from "../user-auth/api/user/user.module";
import { GoogleCalendarModule } from "../google-calendar/google-calendar.module";
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Break.name, schema: BreakSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
    UserModule,
    GoogleCalendarModule,
  ],
  controllers: [BreakController],
  providers: [BreakService, BreakRepository],
})
export class BreakModule {}
