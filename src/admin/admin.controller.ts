import {
  Body,
  Controller,
  Post,
  Get,
  Put,
  Query,
  Delete,
  Param,
  Request,
  UseGuards,
} from "@nestjs/common";
import { AdminDto } from "./admin.dto";
import { AdminService } from "./admin.service";
import { ObjectId } from "mongoose";
import { JwtAuthGuard } from "../user-auth/api/auth/jwt-auth.gaurd";
import { Admin } from "./admin.schema";
import { OnBreak } from "./interfaces/on_break";
import { MyAdmins } from "./interfaces/my_admins";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(JwtAuthGuard)
  @Post("add-user")
  async addUser(@Body() admin: AdminDto, @Request() req): Promise<ObjectId> {
    admin.adminId = req.user.sub;
    const insertedId = await this.adminService.addUSer(admin);
    return insertedId;
  }

  @UseGuards(JwtAuthGuard)
  @Delete("delete/:email") // Use route parameter
  async deleteAdmin(
    @Param("email") email: string,
    @Query("isAdmin") isAdmin: string,
    @Request() req,
  ): Promise<ObjectId> {
    const insertedId = await this.adminService.deleteUser(
      email,
      isAdmin,
      req.user.sub,
    );
    return insertedId;
  }

  @UseGuards(JwtAuthGuard)
  @Get("get-count")
  async getAdminConut(@Request() req): Promise<number> {
    const users = await this.adminService.getUsersCounts(req.user.sub);
    return users;
  }

  @UseGuards(JwtAuthGuard)
  @Get("get")
  async getAdmin(@Request() req): Promise<Admin[]> {
    const users = await this.adminService.getUsers(req.user.sub);
    return users;
  }

  @UseGuards(JwtAuthGuard)
  @Get("onBreak")
  async onBreak(@Request() req): Promise<OnBreak[]> {
    const users = await this.adminService.getOnBreak(req.user.sub);
    return users;
  }

  @UseGuards(JwtAuthGuard)
  @Get("onLeaves")
  async onLeaves(
    @Request() req,
    @Query("todayDate") todayDate?: string,
  ): Promise<OnBreak[]> {
    const users = await this.adminService.getOnLeaves(req.user.sub, todayDate);
    return users;
  }

  @Post("accept-email-invitation")
  async newEmail(@Query("token") token: string): Promise<any> {
    try {
      const repsonse = await this.adminService.verifyEmailToken(token);

      return { status: "success", message: "Email successfully accepted." };
    } catch (err) {
      console.error("Error verifying email:", err);
      throw new Error("Invalid or expired token.");
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("my-admins") // no route param
  async myAdmin(
    @Query("email") email: string,
    @Request() req,
  ): Promise<MyAdmins[]> {
    const admins = await this.adminService.myAdmin(email, req.user.sub);
    return admins;
  }

  @UseGuards(JwtAuthGuard)
  @Get("accept-admin")
  async acceptAdmin(
    @Query("adminId") adminId: string,
    @Request() req,
  ): Promise<ObjectId> {
    return this.adminService.acceptAdmin(adminId, req.user.sub);
  }
}
