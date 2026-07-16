import {
  Controller,
  Post,
  Logger,
  Request,
  UseGuards,
  Get,
  Req,
  Query,
  Res,
  Body,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.gaurd";
import { LocalAuthGuard } from "./local-auth.gaurd";
import { GithubOAuthGuard } from "./github.guard";
import { GoogleOAuthGuard } from "./google.guard";
import { GoogleCalendarLoginGuard } from "./google.guard-calenadr";
import { MailService } from "../../../mail/mail.service";
@Controller("auth")
export class AuthController {
  logger: Logger;
  constructor(private readonly authService: AuthService, private readonly mailerService: MailService,) {
    this.logger = new Logger(AuthController.name);
  }

  @Post("login")
  @UseGuards(LocalAuthGuard)
  async login(@Request() req): Promise<any> {
    try {
      const jwtToken = await this.authService.login(req.user, false); // Now uses login method
      return {
        id: req.user["_id"],
        name: req.user.name,
        email: req.user.email,
        ...jwtToken, // Includes access_token and refresh_token
      };
    } catch (error) {
      console.log("sign in error", error);
      throw error;
    }
  }

  @Post("refresh-token")
  async refreshToken(
    @Body("refresh_token") refreshToken: string,
  ): Promise<any> {
    try {
      // Call the auth service to refresh the token
      return await this.authService.refreshToken(refreshToken);
    } catch (error) {
      // Handle and log the error
      console.error("Error refreshing token:", error.message);

      // Return an appropriate error response
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error:
            "Failed to refresh token. Please try again or contact support.",
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("viewProfile")
  async getUser(@Request() req): Promise<any> {
    return {
      userId: req.user.sub, // Mapping sub to userId
      name: req.user.name,
      email: req.user.email,
      syncedEmail: req.user.syncedEmail,
      isGoogleSync: !!req.user.googleRefreshToken,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post("disconnect-calendar")
  async disconnectCalendar(@Request() req): Promise<any> {
    try {
      const userId = req.user.sub;
      await this.authService.disconnectCalendar(userId);
      return {
        message: "Google Calendar disconnected successfully",
      };
    } catch (error) {
      this.logger.error("Error in disconnectCalendar:", error);
      throw error;
    }
  }

  @Get('connect-calendar')
  async connectCalendar(@Query('state') state: string, @Res() res) {
    if (!state || state === 'undefined' || state === 'null') {
      throw new UnauthorizedException("User ID (state) is required to connect calendar");
    }
    return res.redirect(`/auth/google/calendar?state=${state}`);
  }

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth() {
    return;
  }

@Get("google/callback")
@UseGuards(GoogleOAuthGuard)
async googleAuthCallback(@Req() req, @Res() res) {
  try {
    const user = await this.authService.login(req.user, true);
      const state = req.query?.state;
      const isMobile = state === "mobile";
      const redirectBase = isMobile ? "workbreak://auth/callback" : `${process.env.FRONTEND_URL}/auth/callback`;
    const redirectUrl = `${redirectBase}?access_token=${user.access_token}&refresh_token=${user.refresh_token}&name=${encodeURIComponent(user.name)}&id=${user.id}&syncedEmail=${user.syncedEmail || ''}`;

    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('Google Login Error:', error);

    return res.redirect(`${process.env.FRONTEND_URL}/login`);
  }
}

  @Get('google/calendar')
  @UseGuards(GoogleCalendarLoginGuard)
  async googleCalendarAuth() {
    return;
  }

@Get('google/calendar/callback')
@UseGuards(GoogleCalendarLoginGuard)
async googleCalendarCallback(@Req() req, @Res() res) {
  const rawState = req.query.state as string;
  let platform = 'web';

  try {
    const decoded = JSON.parse(Buffer.from(rawState, 'base64').toString('utf-8'));
    platform = decoded.platform ?? 'web';
  } catch {
    // state wasn't encoded (legacy or direct hit) — default to web
  }

  const isMobile = platform === 'mobile';

  try {
    await this.mailerService.sendGoogleCalendarSyncedEmail(req.user.syncedEmail);

    console.log('Google Calendar Callback isMobile:', isMobile);

    if (isMobile) {
      return res.redirect(`workbreak://auth/callback?type=calendar-synced`);
    }

    return res.send(`
  <html>
    <body>
      <h3>Calendar Connected ✔</h3>
      <script>
        (function() {
          function tryPostMessage() {
            if (window.opener) {
              window.opener.postMessage({
                status: 'success',
                type: 'calendar-synced'
              }, '${process.env.FRONTEND_URL}');
              window.close();
            } else {
              // Firefox fallback — use localStorage polling
              localStorage.setItem('calendar-sync-status', JSON.stringify({
                status: 'success',
                type: 'calendar-synced',
                timestamp: Date.now()
              }));
              document.getElementById('firefoxmsg').innerText = 'Calendar connected! You can close this tab.';
            }
          }

          // Small delay to let Firefox settle
          setTimeout(tryPostMessage, 300);
        })();
      </script>
      <p id="firefoxmsg"></p>
    </body>
  </html>
`);;
  } catch (e) {
    console.error(e);

    if (isMobile) {
      return res.redirect(`workbreak://auth/callback?type=error&type=calendar-synced`);
    }

    return res.send(`
      <script>
        window.opener.postMessage({
          status: 'error',
          type: 'calendar-synced'
        }, '*');

        window.close();
      </script>
    `);
  }
}

  @Get("github")
  @UseGuards(GithubOAuthGuard)
  async githubAuth(@Req() req) { }

  @Get("github/callback")
  @UseGuards(GithubOAuthGuard)
  async githubAuthCallback(@Req() req, @Res() res) {
    try {
      const user = await this.authService.login(req.user, true);
      
      // ✅ Read from req.query not req.user
      const state = req.query?.state;
      const isMobile = state === 'mobile';
      
      const redirectBase = isMobile
        ? 'workbreak://auth/callback'
        : `${process.env.FRONTEND_URL}/auth/callback`;

      const redirectUrl = `${redirectBase}?access_token=${user.access_token}&refresh_token=${user.refresh_token}&name=${encodeURIComponent(user.name)}&id=${user.id}&syncedEmail=${user.syncedEmail || ''}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('Github auth callback error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/login`);
    }
  }
}
