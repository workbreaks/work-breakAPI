import { forwardRef, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AdminRepository } from "./admin.repository";
import { MongooseModule } from "@nestjs/mongoose";
import { Admin, AdminSchema } from "./admin.schema";
import { MailService } from "../mail/mail.service";
import { UserModule } from "../user-auth/api/user/user.module";
import { Break, BreakSchema } from "../break/break.schema";
import { Leaves, LeavesSchema } from "../leaves/leaves.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: Break.name, schema: BreakSchema },
      ,
      { name: Leaves.name, schema: LeavesSchema },
    ]),
    forwardRef(() => UserModule),
    JwtModule.registerAsync({
      imports: [ConfigModule], // Import ConfigModule to use ConfigService
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('HI_BREAKS_JWT_SECRET'),
        signOptions: { expiresIn: "3000s" },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, MailService, AdminRepository],
  exports: [AdminService],
})
export class AdminModule {}
