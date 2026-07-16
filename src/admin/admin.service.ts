import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { MailService } from "../mail/mail.service";
import { AdminDto } from "./admin.dto";
import { AdminRepository } from "./admin.repository";
import { Model, ObjectId } from "mongoose";
import { Admin } from "./admin.schema";
import { User, UserDocument } from "../user-auth/api/user/model/user.schema";
import { InjectModel } from "@nestjs/mongoose";
import { OnBreak } from "./interfaces/on_break";
import { MyAdmins } from "./interfaces/my_admins";
@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly adminRepository: AdminRepository,
    private readonly mailerService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  async addUSer(dto: AdminDto): Promise<ObjectId> {
    try {
      const user = await this.userModel.findOne({ email: dto.userEmail });
      if (!user)
        throw new NotFoundException(
          "This user is not registered in work-break.",
        );
      if (!user.isActive)
        throw new NotFoundException("Email exists in system but is inactive");
      await this.sendUserInvitationEmail(
        dto.userEmail,
        user.name,
        user._id,
        dto.email,
        dto.name,
        dto.adminId,
      );
      const body = {
        adminId: dto.adminId,
        name: user.name,
        email: user.email,
        userId: user._id,
        isAccepted: false,
      };
      const id = await this.adminRepository.addUser(body);
      return id;
    } catch (err) {
      throw err;
    }
  }

  async sendUserInvitationEmail(
    userEmail: string,
    userName: string,
    id: string,
    adminEmail: string,
    adminName: string,
    adminId: string,
  ): Promise<void> {
    try {
      const acceptToken = this.generateAcceptToken(id, adminId);
      const acceptLink = `${process.env.WEB_URL}/accept-email-invitation?token=${acceptToken}`;
      const response = await this.mailerService.sendInvitationMail(
        userEmail,
        userName,
        adminEmail,
        adminName,
        acceptLink,
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  generateAcceptToken(userId: string, adminId: string): string {
    const payload = {
      userId: userId,
      adminId: adminId,
      type: "emailInvitation",
    }; // Add purpose/type to token
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET, // Use environment variable for secret
      expiresIn: "2h",
    });
  }

  async verifyEmailToken(
    token: string,
  ): Promise<{ userId: string; newEmail: string }> {
    try {
      const decoded = this.jwtService.verify(token);
      if (decoded.type !== "emailInvitation") {
        throw new UnauthorizedException("Invalid token type");
      }

      const { userId, adminId } = decoded;
      const response = await this.adminRepository.updateUserAcceptedField(
        userId,
        adminId,
      );

      if (!response) {
        throw new Error("Invalid or expired token.");
      }

      return response as any;
    } catch (err) {
      console.error("Error verifying token:", err);
      throw new Error("Invalid or expired token.");
    }
  }

  async deleteUser(
    email: string,
    isAdmin: string,
    requesterId: string,
  ): Promise<ObjectId> {
    const id = await this.adminRepository.deleteUser(
      email,
      isAdmin,
      requesterId,
    );
    return id;
  }

  async getUsersCounts(adminId: string): Promise<number> {
    const users = await this.adminRepository.getUsersCounts(adminId);
    return users;
  }

  async getUsers(adminId: string): Promise<Admin[]> {
    const users = await this.adminRepository.getUSers(adminId);
    return users;
  }

  async getOnBreak(adminId: string): Promise<OnBreak[]> {
    const users = await this.adminRepository.getOnBreak(adminId);
    return users;
  }

  async getOnLeaves(adminId: string, todayDate: string): Promise<OnBreak[]> {
    const users = await this.adminRepository.getOnLeaves(adminId, todayDate);
    return users;
  }

  async updateName(name: string, userId: string): Promise<ObjectId> {
    const users = await this.adminRepository.updateName(name, userId);
    return users;
  }

  async updateEmail(email: string, userId: string): Promise<ObjectId> {
    const users = await this.adminRepository.updateEmail(email, userId);
    return users;
  }

  async myAdmin(email: string, userId: string): Promise<MyAdmins[]> {
    const admins = await this.adminRepository.myAdmin(email, userId);
    return admins;
  }

  async acceptAdmin(adminId: string, userId: string): Promise<ObjectId> {
    try {
      const response = await this.adminRepository.updateUserAcceptedField(
        userId,
        adminId,
      );

      if (!response) {
        throw new Error("Invalid or expired token.");
      }

      return response as any;
    } catch (err) {
      console.error("Error verifying token:", err);
      throw new Error("Invalid or expired token.");
    }
  }
}
