import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class GoogleCalendarLoginGuard extends AuthGuard("google-calendar") {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const state = request.query?.state;

    return {
      session: false,
      state,

      accessType: "offline",
      prompt: "consent",

      scope: [
        "email",
        "profile",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/tasks",
      ],
    };
  }
}