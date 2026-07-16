import { Injectable } from "@nestjs/common";
import { CheckListDto } from "./daily-checklist.dto";
import { CheckListRepository } from "./daily-checklist.repository";
import { ObjectId } from "mongoose";
import { CheckList } from "./daily-checklist.schema";

@Injectable()
export class CheckListService {
  constructor(private readonly repository: CheckListRepository) {}

  async createCheckList(
    dto: CheckListDto,
    mongoId: string | undefined,
  ): Promise<ObjectId | string> {
    const id = await this.repository.createCheckList(dto, mongoId);
    return id;
  }

  async deleteCheckList(userId: string, mongoId: string): Promise<ObjectId> {
    const id = await this.repository.deleteCheckList(userId, mongoId);
    return id;
  }

  async getCheckList(
    userId: string,
    skip: number,
    limit: number,
    task?: string,
    status?: boolean,
    createdDateFrom?: string | null,
    createdDateTo?: string | null,
  ): Promise<{ checkList: CheckListDto[]; totalCount: number }> {
    const { checkList, totalCount } = await this.repository.getCheckList(
      userId,
      skip,
      limit,
      task,
      status,
      createdDateFrom,
      createdDateTo,
    );
    return { checkList, totalCount };
  }

  async getCheckListWithTwoLatestDates(
    userId: string,
  ): Promise<{
    checkList: CheckListDto[];
    featureList: CheckListDto[];
    totalCount: number;
  }> {
    const { checkList, featureList, totalCount } =
      await this.repository.getCheckListWithTwoLatestDates(userId);
    return { checkList, featureList, totalCount };
  }
}
