import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { JwtAuthGuard } from "../user-auth/api/auth/jwt-auth.gaurd";

@UseGuards(JwtAuthGuard)
@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get("info")
  async getUserInfoWithCounts(@Request() req): Promise<any> {
    return this.settingsService.getUserInfoWithCounts(req.user.sub);
  }

  @Get("priority-status")
  async getTasksByPriorityAndStatus(@Request() req): Promise<any> {
    return this.settingsService.getTasksByPriorityAndStatus(req.user.sub);
  }
  @Post("delete-account")
  async deleteAccount(@Request() req): Promise<boolean> {
    const isDeleted = await this.settingsService.deleteAccount(req.user.sub);
    return isDeleted;
  }
}
