import {
  Controller,
  Post,
  Request,
  Logger,
  UseGuards,
  Body,
  Put,
  Param,
  Get,
  Query,
  BadRequestException,
  HttpException,
} from "@nestjs/common";
import { ConflictException } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.gaurd";
import { UserService } from "./user.service";

@Controller("user")
export class UserController {
  logger: Logger;
  constructor(private readonly userService: UserService) {
    this.logger = new Logger(UserController.name);
  }

  @Post("signup")
  async create(@Request() req): Promise<any> {
    const newUser = req.body;
    try {
      if (newUser.email.includes("@googlemail.com")) {
        newUser.email = newUser.email.replace("@googlemail.com", "@gmail.com");
      }
      const query = { email: newUser.email };
      const user = await this.userService.findOne(query);
      if (user?.provider === "google" || user?.provider === "github") {
        throw new ConflictException(
          "This email is registered with Google or GitHub. Please sign in using that provider.",
        );
      }
      if (user && user.isActive) {
        throw new ConflictException("Email Already Exist");
      } else if (user && !user.isActive) {
        await this.userService.reSendRegisterationEmail(user);
      } else {
        const user = await this.userService.signup(newUser);
        return user;
      }
    } catch (err) {
      this.logger.error("Something went wrong in signup:", err);
      throw err;
    }
  }

  @Post("forgot-password")
  async requestPasswordReset(@Body("email") email: string): Promise<any> {
    await this.userService.sendPasswordResetEmail(email);
    return { message: "Password reset email sent successfully" };
  }

  @UseGuards(JwtAuthGuard)
  @Put("update-name")
  async updateName(@Body("name") name: string, @Request() req): Promise<any> {
    try {
      return await this.userService.updateName(req.user.sub, name);
    } catch (err) {
      this.logger.error("Error updating name:", err);
      throw err;
    }
  }

  @Post("resend-verification")
  async resendVerification(@Body("email") email: string): Promise<any> {
    try {
      await this.userService.sendReVerificationToken(email); // Send the email
      return { status: "success", message: "Verification email sent." };
    } catch (err) {
      this.logger.error("Error resending verification email:", err);
      throw new HttpException("Unable to resend verification email", 500);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put("update-email")
  async updateEmail(
    @Body("email") email: string,
    @Body("name") name: string,
    @Request() req,
  ): Promise<any> {
    try {
      // Step 1: Generate verification token and send email
      const verificationToken = await this.userService.initiateEmailUpdate(
        req.user.sub,
        email,
        name,
      );

      if (verificationToken) {
        return {
          status: "pending_verification",
          message: "Verification email sent.",
        };
      } else {
        throw new Error("Failed to send verification email.");
      }
    } catch (err) {
      this.logger.error("Error updating email:", err);
      throw new Error("Error updating email.");
    }
  }

  @Get("verify-new-email")
  async newEmail(@Query("token") token: string): Promise<any> {
    try {
      const repsonse = await this.userService.verifyEmailToken(token);

      return { status: "success", message: "Email successfully updated." };
    } catch (err) {
      console.error("Error verifying email:", err);
      throw new Error("Invalid or expired token.");
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put("update-password")
  async updatePassword(
    @Body("password") password: string,
    @Request() req,
  ): Promise<any> {
    try {
      return await this.userService.updatePassword(req.user.sub, password);
    } catch (err) {
      this.logger.error("Error updating password:", err);
      throw err;
    }
  }

  @Get("verify")
  async verifyEmail(@Query("token") token: string): Promise<any> {
    try {
      const decoded = this.userService.verifyToken(token);
      const userId = decoded.sub;
      // Find and activate the user
      const userData =
        await this.userService.updateUserVerificationStatus(userId);
      return { message: "Email verified successfully" };
    } catch (error) {
      throw new BadRequestException("Invalid or expired token");
    }
  }

  @Post("reset-password")
  async resetPassword(
    @Body("token") token: string,
    @Body("newPassword") newPassword: string,
  ): Promise<any> {
    try {
      const userData = await this.userService.ResetPassword(token, newPassword);
      return { message: "Password Updated successfully" };
    } catch (error) {
      throw new BadRequestException("Invalid or expired token");
    }
  }
}
