import {
  Injectable,
  forwardRef,
  Inject,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
// import * as bcrypt from 'bcrypt';
import * as argon2 from "argon2";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { User, UserDocument } from "./auth.schema";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { TypeService } from "../../../break/type/type.service";
@Injectable()
export class AuthService {
  private readonly users: User[] = [];
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private typeService: TypeService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    const query = { email: email };
    const user = await this.findOne(query);
    if (!user) throw new NotFoundException("Email Does not exist");
    if (user?.provider === "google" || user?.provider === "github") {
      throw new NotFoundException(
        "This email is registered with Google or GitHub. Please sign in using that provider.",
      );
    }

    const isMatched = await this.comparePasswords(pass, user.password);
    if (!isMatched) throw new UnauthorizedException("Invalid Password");
    return user;
  }

  async findOne(query: any): Promise<any> {
    return await this.userModel.findOne(query).select("+password");
  }

  async generateJwtToken(user: any) {
    const payload = {
      id: user._id, // Ensure these fields are included
      name: user.name,
      email: user.email,
    };
    return {
      access_token: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('HI_BREAKS_JWT_SECRET'),
      }),
    };
  }

  // async generateJwtToken(user: any) {
  //   const payload = {
  //     email: user.email
  //   };
  //   return {
  //     access_token: this.jwtService.sign(payload),
  //   };
  // }

  async getHashedPassword(password: string): Promise<any> {
    try {
      // Hash the password using argon2
      const hashedPassword = await argon2.hash(password);
      return hashedPassword;
    } catch (err) {
      throw new Error("Error hashing password");
    }
  }

  async comparePasswords(
    password: string,
    hashedPassword: string,
  ): Promise<any> {
    try {
      // Compare the password using argon2
      const isMatch = await argon2.verify(hashedPassword, password);
      return isMatch; // returns true if passwords match, false otherwise
    } catch (err) {
      throw new Error("Error comparing passwords");
    }
  }

  async create(user: any): Promise<any> {
    let newUser: any = {
      name: user.name,
      provider: user.provider,
      email: user.email,
      isActive: true,
    };

    if (user.googleId) {
      newUser.providerId = user.googleId;
      newUser.provider = "google";
    } else if (user.githubId) {
      newUser.providerId = user.githubId;
      newUser.provider = "github";
    } else {
      const hashedPassword = await this.getHashedPassword(user.password);
      newUser.password = hashedPassword;
      newUser.isActive = false;
    }
    const createdUser = new this.userModel(newUser);
    const savedUser = await createdUser.save();
    const savedUserId = savedUser?._id;
    if (savedUserId) {
      await this.typeService.createBreaksType(savedUserId);
    }
    return savedUser;
  }

  async findOrCreate(userDetails: any): Promise<any> {
    try {
      if (userDetails?.email?.includes("@googlemail.com")) {
        userDetails.email = userDetails.email.replace(
          "@googlemail.com",
          "@gmail.com",
        );
      }
      let user;
      if (userDetails.googleId) {
        user = await this.userModel.findOne({
          providerId: userDetails.googleId,
        });
      }
      if (userDetails.githubId) {
        user = await this.userModel.findOne({
          providerId: userDetails.githubId,
        });
      }
      if (user) {
        return user; // Return the user if found
      } else {
        // If the user doesn't exist, create a new one
        const query = { email: userDetails.email };
        const isUserExist = await this.findOne(query);
        console.log("isUserExist", isUserExist);
        if (isUserExist) {
          // if exist the same email and user hit it from gmail or github still login with that
          // if not active make it aactive in db
          if (!isUserExist.isActive) {
            isUserExist.isActive = true;
            const breakTypeExists =
              await this.typeService.isBreakTypeExistsForUser(isUserExist._id);

            if (!breakTypeExists) {
              await this.typeService.createBreaksType(isUserExist._id);
            }
            await isUserExist.save();
          }
          return isUserExist;
        }

        user = await this.create(userDetails);
        return user;
      }
    } catch (error) {
      console.error("Error in findOrCreate:", error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const decodedUser = this.jwtService.verify(refreshToken);
      // Fetch fresh user from DB to get the live user details
      const user = await this.findOne({ _id: decodedUser.sub });
      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      // Generate a new access token
      const newAccessToken = this.jwtService.sign(
        {
          name: user.name,
          sub: user._id,
          email: user.email,
        },
        { expiresIn: "8h" },
      );

      return {
        access_token: newAccessToken,
        refresh_token: refreshToken,
        name: user.name,
        syncedEmail: user.syncedEmail,
        id: user._id, // Use user ID
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }

  async findUserBySyncedEmail(email: string) {
    return this.userModel.findOne({ syncedEmail: email }).exec();
  }

  async updateUserSyncTokens(userId: string, data: { googleRefreshToken: string, syncedEmail: string }) {
    try {
      // Using findOneAndUpdate to explicitly query by _id
      const updatedUser = await this.userModel.findOneAndUpdate(
        { _id: userId },
        {
          googleRefreshToken: data.googleRefreshToken,
          syncedEmail: data.syncedEmail
        },
        { new: true }
      ).exec();
      if (!updatedUser) {
        console.log(`User heavily attempted to update but not found: ${userId}`);
      }

      return updatedUser;
    } catch (error) {
      console.log("Error updating user sync tokens:", error);
      throw error;
    }
  }

  async disconnectCalendar(userId: string): Promise<any> {
    try {
      const updatedUser = await this.userModel.findOneAndUpdate(
        { _id: userId },
        {
          $unset: {
            googleRefreshToken: 1,
            syncedEmail: 1,
          },
        },
        { new: true }
      ).exec();

      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      return updatedUser;
    } catch (error) {
      console.log("Error disconnecting Google Calendar:", error);
      throw error;
    }
  }

  async login(user: any, isSocialLogin) {
    if (!user.isActive && !isSocialLogin) {
      throw new NotFoundException(
        "Your account is inactive. Please activate it from your email. If you lost the activation email, please register again to receive a new invitation.",
      );
    }
    const payload = {
      name: user.name,
      sub: user._id,
      email: user.email,
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: "8h" }); // Access token valid for 8 hours
    const refreshToken = this.jwtService.sign(payload, { expiresIn: "7d" }); // Refresh token valid for 7 days
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      name: user.username ?? user.name,
      syncedEmail: user.syncedEmail,
      id: user["_id"],
    };
  }
}
