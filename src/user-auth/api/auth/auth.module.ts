import { Module, forwardRef } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config"; // Import ConfigModule and ConfigService
import { JwtStrategy } from "./jwtStratergy";
import { AuthController } from "./auth.controller";
import { ProtectedController } from "./protected.controller.ts";
import { AuthService } from "./auth.service";
import { LocalStrategy } from "./localStrategy";
import { GoogleStrategy } from "./google.strategy";
import { GoogleCalendarStrategy } from "./google-calendar.strategy";
import { GithubStrategy } from "./github.strategy";
import { TypeModule } from "../../../break/type/type.module";
import { MailService } from "../../../mail/mail.service";
import { User, UserSchema } from "./auth.schema";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ConfigModule, // Import ConfigModule
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
  ],
  controllers: [AuthController, ProtectedController],
  providers: [
    AuthService,
    MailService,
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
    GoogleCalendarStrategy,
    GithubStrategy
  ],
  exports: [AuthService],
})
export class AuthModule {}
