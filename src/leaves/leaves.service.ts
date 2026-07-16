import { Injectable } from "@nestjs/common";
import { LeavesDto } from "./leaves.dto";
import { LeavesRepository } from "./leaves.repository";
import { ObjectId } from "mongoose";

@Injectable()
export class LeavesService {
  constructor(private readonly leavesRepository: LeavesRepository) {}

  async createLeaves(
    dto: LeavesDto,
    mongoId: string | undefined,
  ): Promise<ObjectId | string> {
    const id = await this.leavesRepository.createLeaves(dto, mongoId);
    return id;
  }

  async deleteLeaves(userId: string, mongoId: string): Promise<ObjectId> {
    const id = await this.leavesRepository.deleteLeaves(userId, mongoId);
    return id;
  }

  async amITheAdmin(userId: string, adminId: string): Promise<boolean> {
    const response = await this.leavesRepository.amITheAdmin(userId, adminId);
    return response;
  }

  async isOnLeave(userId: string, todayDate: string): Promise<boolean> {
    return await this.leavesRepository.isOnLeave(userId, todayDate);
  }

  async getLeaves(
    userId: string,
    skip: number,
    limit: number,
    fromDate?: string,
    toDate?: string,
  ): Promise<{ leaves: LeavesDto[]; totalCount: number; allCount: number }> {
    const { leaves, totalCount, allCount } =
      await this.leavesRepository.getLeaves(
        userId,
        skip,
        limit,
        fromDate,
        toDate,
      );
    return { leaves, totalCount, allCount };
  }
}