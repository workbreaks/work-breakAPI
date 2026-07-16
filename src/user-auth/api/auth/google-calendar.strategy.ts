import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { OAuth2Client } from "google-auth-library";
import { AuthService } from "./auth.service";

@Injectable()
export class GoogleCalendarStrategy extends PassportStrategy(
  Strategy,
  "google-calendar",
) {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALENDAR_CALLBACK_URL,

      scope: [
        "email",
        "profile",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/tasks",
      ],

      accessType: "offline",
      prompt: "consent",

      passReqToCallback: true,
      session: false,
      proxy: true,
    });
  }

  async validate(
  req: any,
  accessToken: string,
  refreshToken: string,
  profile: any,
  done: VerifyCallback,
) {
  try {
     const rawState = req.query?.state;
    console.log("user sate", rawState);
    if (!rawState) {
      return done(new UnauthorizedException("Missing user ID"), null);
    }

    // Decode the state param
    let userId: string;
    try {
      const decoded = JSON.parse(Buffer.from(rawState, 'base64').toString('utf-8'));
      userId = decoded.userId;
    } catch {
      // Fallback: treat state as plain userId (backwards compat)
      userId = rawState;
    }
console.log("user userId", userId);
    if (!userId) {
      return done(new UnauthorizedException("Missing user ID"), null);
    }

    // Verify granted Google scopes
    const oauth2 = new OAuth2Client();

    oauth2.setCredentials({
      access_token: accessToken,
    });

    const tokenInfo = await oauth2.getTokenInfo(accessToken);

    const grantedScopes = tokenInfo.scopes || [];

    const hasCalendarScope = grantedScopes.includes(
      "https://www.googleapis.com/auth/calendar.events",
    );

    if (!hasCalendarScope) {
      return done(
        new UnauthorizedException(
          "Google Calendar permission was not granted. Please reconnect and allow calendar access.",
        ),
        null,
      );
    }

    if (!refreshToken) {
      return done(
        new UnauthorizedException(
          "Google did not return refresh token",
        ),
        null,
      );
    }

    const syncedEmail = profile.emails?.[0]?.value
      ?.trim()
      ?.toLowerCase();

    if (!syncedEmail) {
      return done(
        new UnauthorizedException(
          "Unable to retrieve Google account email",
        ),
        null,
      );
    }

    // Check if this Google account is already linked
    const existingOwner =
      await this.authService.findUserBySyncedEmail(
        syncedEmail,
      );

    if (
      existingOwner &&
      existingOwner._id.toString() !== userId
    ) {
      return done(
        new UnauthorizedException(
          "This Google account is already linked to another user.",
        ),
        null,
      );
    }

    const updatedUser =
      await this.authService.updateUserSyncTokens(
        userId,
        {
          googleRefreshToken: refreshToken,
          syncedEmail,
        },
      );

    return done(null, updatedUser);
  } catch (error: any) {
    // Mongo duplicate key protection (recommended if syncedEmail is unique)
    if (error?.code === 11000) {
      return done(
        new UnauthorizedException(
          "This Google account is already linked to another user.",
        ),
        null,
      );
    }

    return done(error, null);
  }
}
}