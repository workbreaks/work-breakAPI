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
import { LeavesDto } from "./leaves.dto";
import { LeavesService } from "./leaves.service";
import { ObjectId } from "mongoose";
import { JwtAuthGuard } from "../user-auth/api/auth/jwt-auth.gaurd";
import { Leaves } from "./leaves.schema";
@UseGuards(JwtAuthGuard)
@Controller("leaves")
export class LeavesController {
  constructor(private readonly leaveservice: LeavesService) {}

  @Post("add")
  async createLeaves(
    @Body() leaves: LeavesDto,
    @Request() req,
  ): Promise<ObjectId | string> {
    const loginId = req.user?.sub;
    if (!loginId) {
      throw new BadRequestException("Unauthorized to create a leave");
    }
    leaves.userId = loginId;
    const response = await this.leaveservice.createLeaves(leaves, undefined);
    return response;
  }

  @Put("edit/:id")
  async editLeaves(
    @Param("id") id: string,
    @Body() leaves: LeavesDto,
    @Request() req,
  ): Promise<ObjectId | string> {
    leaves.userId = req.user.sub;
    const response = await this.leaveservice.createLeaves(leaves, id);
    return response;
  }

  @Delete("delete/:id")
  async deleteLeaves(
    @Param("id") id: string,
    @Request() req,
  ): Promise<ObjectId> {
    const insertedId = await this.leaveservice.deleteLeaves(req.user.sub, id);
    return insertedId;
  }

  @Get("isOnLeave")
  async isOnLeave(
    @Request() req,
    @Query("todayDate") todayDate?: string,
  ): Promise<boolean> {
    const id = req.user.sub;
    return await this.leaveservice.isOnLeave(id, todayDate);
  }
  @Get("get")
  async getLeaves(
    @Query("id") id: string,
    @Request() req,
    @Query("skip") skip: any,
    @Query("limit") limit: any,
    @Query("userId") userId?: string,
    @Query("fromDate") fromDate?: string,
    @Query("toDate") toDate?: string,
  ): Promise<{ leaves: LeavesDto[]; totalCount: number; allCount: number }> {
    const loginId = req.user.sub;
    if (id !== loginId) {
      throw new BadRequestException("Unauthorized to view Leaves");
    }
    const isAbleToView = await this.leaveservice.amITheAdmin(userId, loginId);
    // hack case, user not accpted to admin and user somehow hack and try
    if (!isAbleToView && userId) {
      throw new BadRequestException("Unauthorized to view Leaves");
    }
    let leavesId = userId;
    // same user looking his own leave
    if (!isAbleToView && !userId) {
      leavesId = loginId;
    }
    // admin looking for the team members leaves
    if (isAbleToView && userId) {
      leavesId = userId;
    }
    const skips = parseInt(skip, 10) || 0;
    const limits = parseInt(limit, 10) || 1000000;
    const { leaves, totalCount, allCount } = await this.leaveservice.getLeaves(
      leavesId,
      skips,
      limits,
      fromDate,
      toDate,
    );
    return { leaves, totalCount, allCount };
  }
}