import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.HI_BREAKS_JWT_SECRET,
    });
  }

  async validate(payload: any) {
    // Fetch the latest user from DB to get the live googleRefreshToken
    const user = await this.authService.findOne({ _id: payload.sub });

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      sub: user._id.toString(), // Convert to string to avoid mismatch in controllers
      name: user.name,
      email: user.email,
      syncedEmail: user.syncedEmail,
      googleRefreshToken: user.googleRefreshToken,
      isGoogleSync: !!user.googleRefreshToken,
    };
  }
}
