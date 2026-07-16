import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module";
import { JwtModule } from "@nestjs/jwt";
import { User, UserSchema } from "./model/user.schema";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { TypeModule } from "../../../break/type/type.module";
import { MailService } from "../../../mail/mail.service";
import { AdminModule } from "../../../admin/admin.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => AuthModule),
    TypeModule,
    AdminModule,
    JwtModule.registerAsync({
      imports: [ConfigModule], // Import ConfigModule to use ConfigService
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('HI_BREAKS_JWT_SECRET'),
        signOptions: { expiresIn: "3000s" },
      }),
      inject: [ConfigService],
    }),
    PassportModule,
    TypeModule,
    AdminModule,
  ],

  controllers: [UserController],
  providers: [UserService, MailService],
  exports: [
    UserService,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
})
export class UserModule {}
