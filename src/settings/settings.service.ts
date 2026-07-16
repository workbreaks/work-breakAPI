import { Injectable } from "@nestjs/common";
import { SettingsRepository } from "./settings.repository";

@Injectable()
export class SettingsService {
  constructor(private readonly repository: SettingsRepository) {}

  async getUserInfoWithCounts(userId: string): Promise<any> {
    const tasks = await this.repository.getUserInfoWithCounts(userId);
    return tasks;
  }

  async getTasksByPriorityAndStatus(userId: string): Promise<any> {
    const tasks = await this.repository.getTasksByPriorityAndStatus(userId);
    return tasks;
  }

  async deleteAccount(userId: string): Promise<boolean> {
    const isDeleted = await this.repository.deleteAccount(userId);
    return isDeleted;
  }
}
