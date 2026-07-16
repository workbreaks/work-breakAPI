import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class GoogleOAuthGuard extends AuthGuard("google") {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const state = request.query?.state || 'web';

    return {
      session: false,
      state,

      // LOGIN ONLY
      scope: ['email', 'profile'],
    };
  }
}