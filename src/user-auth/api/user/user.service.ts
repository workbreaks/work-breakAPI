import {
  Injectable,
  forwardRef,
  Inject,
  Logger,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model } from "mongoose";
import { User, UserDocument } from "./model/user.schema";
import { AuthService } from "../auth/auth.service";
import { TypeService } from "../../../break/type/type.service";
import { MailService } from "../../../mail/mail.service";
import { AdminService } from "../../../admin/admin.service";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class UserService {
  logger: Logger;
  private readonly users: User[] = [];

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
    private typeService: TypeService,
    private adminService: AdminService,
    private readonly mailerService: MailService,
    private readonly jwtService: JwtService,
  ) {
    this.logger = new Logger(UserService.name);
  }

  async findOne(query: any): Promise<any> {
    return await this.userModel.findOne(query).select("+password");
  }

  async find(usersFilterQuery: FilterQuery<User>): Promise<User[]> {
    return this.userModel.find({ usersFilterQuery });
  }

  generateVerificationToken(userId: string): string {
    const payload = { sub: userId }; // Use 'sub' to hold the user ID
    return this.jwtService.sign(payload, {
      expiresIn: "2h",
    });
  }

  async signup(user: any): Promise<any> {
    let savedUserId = "";
    try {
      const hashedPassword = await this.authService.getHashedPassword(
        user.password,
      );
      user.password = hashedPassword;
      user.isActive = false;
      const newUser = new this.userModel(user);
      const savedUser = await newUser.save();
      savedUserId = savedUser?._id;
      if (savedUserId) {
        const verificationToken = this.generateVerificationToken(savedUserId);
        const verificationLink = `${process.env.WEB_URL}/user/verify?token=${verificationToken}`;

        const response = await this.mailerService.sendRegistrationEmail(
          user.email,
          user.name,
          verificationLink,
        );
        this.logger.log(
          "Inserted additional data into breaks collection",
          response,
        );
        return savedUserId;
      }
    } catch (error) {
      console.error("Error sending welcome email:", error);
      await this.userModel.deleteOne({ _id: savedUserId });
      throw new Error(error);
    }
  }

  async reSendRegisterationEmail(user: any) {
    try {
      const verificationToken = this.generateVerificationToken(user._id);

      const verificationLink = `${process.env.WEB_URL}/user/verify?token=${verificationToken}`;

      const response = await this.mailerService.sendRegistrationEmail(
        user.email,
        user.name,
        verificationLink,
      );
      this.logger.log(
        "Inserted additional data into breaks collection",
        response,
      );
      return user._id;
    } catch (error) {
      console.error("Error sending welcome email:", error);
      throw new Error(error);
    }
  }

  async sendReVerificationToken(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException("User not found");
    const verificationToken = this.generateVerificationToken(user._id);
    const verificationLink = `${process.env.WEB_URL}/user/verify?token=${verificationToken}`;

    const response = await this.mailerService.sendRegistrationEmail(
      email,
      user.name,
      verificationLink,
    );
  }

  verifyToken(token: string): any {
    return this.jwtService.verify(token);
  }

  async updateUserVerificationStatus(userId: string) {
    try {
      const updatedUser = await this.userModel.findByIdAndUpdate(
        userId, // Find the user by ID
        { isActive: true }, // Update the active status to true
        { new: true }, // Return the updated document
      );

      if (!updatedUser) {
        throw new Error("User not found");
      }

      await this.typeService.createBreaksType(userId);
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  async ResetPassword(token: string, newPassword: string): Promise<any> {
    const decoded = this.jwtService.verify(token);
    const userId = decoded.userId;
    try {
      const user = await this.userModel.findById(userId);
      if (!user) throw new NotFoundException("User not found");

      user.password = await this.authService.getHashedPassword(newPassword);
      await user.save();

      return { message: "Password reset successfully" };
    } catch (error) {
      throw error;
    }
  }
  
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      const user = await this.userModel.findOne({ email });
      if (!user) throw new NotFoundException("User not found");
      if (user.isActive === false) throw new NotFoundException("Email is not active");
      if (user.provider === "google" || user.provider === "github") {
        throw new BadRequestException(
          `You signed up using ${user.provider}. Please log in with ${user.provider}.`,
        );
      }
      const resetToken = this.jwtService.sign(
        { userId: user._id },
        { expiresIn: "2h" },
      );

      const resetLink = `${process.env.WEB_URL}/verify-reset-password?token=${resetToken}`;

      await this.mailerService.sendForgotPasswordMail(
        user.email,
        user.name,
        resetLink,
      );
    } catch (error) {
      throw error;
    }
  }

  async findOrCreate(userDetails: any): Promise<any> {
    try {
      // Try to find the user by Google ID
      let user = await this.userModel.findOne({
        googleId: userDetails.googleId,
      });
      if (user) {
        return user; // Return existing user if found
      } else {
        user = await this.signup(userDetails); // Use your existing `create` method
        return user;
      }
    } catch (error) {
      // Handle errors
      console.error("Error in findOrCreate:", error);
      throw error;
    }
  }

  async findOneAndUpdate(query: any, payload: any): Promise<User> {
    return this.userModel.findOneAndUpdate(query, payload, {
      new: true,
      upsert: true,
    });
  }

  async findOneAndRemove(query: any): Promise<any> {
    return this.userModel.findOneAndRemove(query);
  }

  async updateName(userId: string, name: string): Promise<any> {
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          userId,
          { name },
          { new: true, useFindAndModify: false },
        )
        .exec();

      if (!updatedUser) {
        throw new BadRequestException("User not found");
      }

      await this.adminService.updateName(name, userId);
      return {
        status: "success",
        message: "Name updated successfully",
      };
    } catch (error) {
      throw new BadRequestException(
        "An error occurred while updating the name",
        error,
      );
    }
  }

  async initiateEmailUpdate(
    userId: string,
    email: string,
    name: string,
  ): Promise<string> {
    try {
      const emailExists = await this.userModel.findOne({ email });
      if (emailExists) {
        throw new BadRequestException("Email already exists");
      }
      // Step 1: Generate verification token
      const verificationToken = this.generateNewEmailVerificationToken(
        userId,
        email,
      );

      // Step 3: Send verification email
      const verificationLink = `${process.env.WEB_URL}/verify-new-email?token=${verificationToken}`;
      await this.mailerService.sendNewEmailVerification(
        email,
        name,
        verificationLink,
      );

      return verificationToken;
    } catch (err) {
      console.error("Error initiating email update:", err);
      throw new Error("Failed to initiate email update.");
    }
  }

  generateNewEmailVerificationToken(userId: string, newEmail: string): string {
    // Generate a token containing userId and newEmail (e.g., using JWT or another method)
    return this.jwtService.sign({ userId, newEmail }, { expiresIn: "1h" });
  }

  async verifyEmailToken(
    token: string,
  ): Promise<{ userId: string; newEmail: string }> {
    try {
      const decoded = this.jwtService.verify(token);
      const { userId, newEmail } = decoded;

      await this.userModel.updateOne(
        { _id: userId },
        {
          $set: { email: newEmail },
        },
      );

      if (!newEmail) {
        throw new Error("Invalid or expired token.");
      }

      // await this.adminModel.updateOne(
      //   { userId },
      //   { $set:  { email: newEmail } }
      // ).exec();
      await this.adminService.updateEmail(newEmail, userId);

      return { userId, newEmail };
    } catch (err) {
      console.error("Error verifying token:", err);
      throw new Error("Invalid or expired token.");
    }
  }

  async updatePassword(userId: string, newPassword: string): Promise<any> {
    // Retrieve the existing user by userId
    const existingUser = await this.userModel
      .findById(userId)
      .select("+password")
      .exec();
    if (!existingUser) {
      throw new BadRequestException(`User with id ${userId} not found`);
    }

    // Ensure that the current password exists
    const currentHashedPassword = existingUser.password;
    if (!currentHashedPassword) {
      throw new BadRequestException(
        "Current password not found in user record.",
      );
    }

    const isSamePassword = await this.authService.comparePasswords(
      newPassword,
      currentHashedPassword,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        "The new password cannot be the same as the old password",
      );
    }
    const hashedPassword =
      await this.authService.getHashedPassword(newPassword);

    existingUser.password = hashedPassword;
    await existingUser.save();

    return { status: "success", message: "Password updated successfully" };
  }
}
