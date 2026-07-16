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
  BadRequestException,
} from "@nestjs/common";
import { CheckListDto } from "./daily-checklist.dto";
import { CheckListService } from "./daily-checklist.service";
import { ObjectId } from "mongoose";
import { JwtAuthGuard } from "../user-auth/api/auth/jwt-auth.gaurd";
import { CheckList } from "./daily-checklist.schema";
@UseGuards(JwtAuthGuard)
@Controller("daily-checklist")
export class CheckListController {
  constructor(private readonly service: CheckListService) {}

  @Post("add")
  async createChecklist(
    @Body() checklist: CheckListDto,
    @Request() req,
  ): Promise<ObjectId | string> {
    const loginId = req.user?.sub;
    if (!loginId) {
      throw new BadRequestException("Unauthorized to create a checklist");
    }
    checklist.userId = loginId;
    const response = await this.service.createCheckList(checklist, undefined);
    return response;
  }

  @Put("edit/:id")
  async editCheckList(
    @Param("id") id: string,
    @Body() checklist: CheckListDto,
    @Request() req,
  ): Promise<ObjectId | string> {
    checklist.userId = req.user.sub;
    const response = await this.service.createCheckList(checklist, id);
    return response;
  }

  @Delete("delete/:id")
  async deleteCheckList(
    @Param("id") id: string,
    @Request() req,
  ): Promise<ObjectId> {
    const insertedId = await this.service.deleteCheckList(req.user.sub, id);
    return insertedId;
  }

  @Get("getCheckListWithTwoLatestDates")
  async getCheckListWithTwoLatestDates(
    @Request() req,
  ): Promise<{
    checkList: CheckListDto[];
    featureList: CheckListDto[];
    totalCount: number;
  }> {
    const loginId = req.user?.sub;
    if (!loginId) {
      throw new BadRequestException("Unauthorized to view CheckList");
    }
    const { checkList, featureList, totalCount } =
      await this.service.getCheckListWithTwoLatestDates(loginId);
    return { checkList, featureList, totalCount };
  }

  @Get("get")
  async getCheckList(
    @Request() req,
    @Query("skip") skip?: string,
    @Query("limit") limit?: string,
    @Query("task") task?: string,
    @Query("status") status?: string,
    @Query("createdDateFrom") createdDateFrom?: string | null,
    @Query("createdDateTo") createdDateTo?: string | null,
  ): Promise<{ checkList: CheckListDto[]; totalCount: number }> {
    const loginId = req.user?.sub;
    if (!loginId) {
      throw new BadRequestException("Unauthorized to view CheckList");
    }
    const parsedStatus =
      status === "true" ? true : status === "false" ? false : undefined;
    console.log(
      "parsedStatus",
      task,
      parsedStatus,
      createdDateFrom,
      createdDateTo,
    );
    const { checkList, totalCount } = await this.service.getCheckList(
      loginId,
      Number(skip) || 0,
      Number(limit) || 20,
      task,
      parsedStatus,
      createdDateFrom,
      createdDateTo,
    );
    return { checkList, totalCount };
  }
}
