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
  ParseBoolPipe,
} from "@nestjs/common";
import { MeetingDto } from "./meeting.dto";
import { MeetingService } from "./meeting.service";
import { ObjectId } from "mongoose";
import { JwtAuthGuard } from "../user-auth/api/auth/jwt-auth.gaurd";

@UseGuards(JwtAuthGuard)
@Controller("meeting")
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @Post("add")
  async createMeeting(
    @Body() meeting: MeetingDto,
    @Request() req,
  ): Promise<ObjectId> {
    const loginId = req.user?.sub;
    const googleRefreshToken = req.user?.googleRefreshToken;
    if (!loginId) {
      throw new BadRequestException("Unauthorized to add Meetings");
    }
    meeting.userId = loginId;
    const insertedId = await this.meetingService.createMeeting(
      meeting,
      undefined,
      googleRefreshToken,
    );
    return insertedId;
  }

  @Put("edit/:id")
  async editMeeting(
    @Param("id") id: string,
    @Body() meeting: MeetingDto,
    @Request() req,
  ): Promise<ObjectId> {
    meeting.userId = req.user.sub;
    const googleRefreshToken = req.user?.googleRefreshToken;
    const insertedId = await this.meetingService.createMeeting(meeting, id, googleRefreshToken);
    return insertedId;
  }

  @Delete("delete/:id")
  async deleteMeeting(
    @Param("id") id: string,
    @Request() req,
  ): Promise<ObjectId> {
    const googleRefreshToken = req.user?.googleRefreshToken;
    const insertedId = await this.meetingService.deleteMeeting(
      req.user.sub,
      id,
      googleRefreshToken,
    );
    return insertedId;
  }

  @Get("get")
  async get(
    @Request() req,
    @Query("todayScheduledDate") todayScheduledDate: string,
    @Query("isToday", ParseBoolPipe) isToday = false,
  ): Promise<MeetingDto[]> {
    const meetings = await this.meetingService.getMeetings(
      req.user.sub,
      todayScheduledDate,
      isToday
    );
    return meetings;
  }

  @Get("all")
  async all(
    @Request() req,
    @Query("skip") skip: any,
    @Query("limit") limit: any,
    @Query("startScheduleDate") startScheduleDate?: string,
    @Query("endScheduleDate") endScheduleDate?: string,
  ): Promise<{ meetings: MeetingDto[]; totalCount: number; allCount: number }> {
    const skips = parseInt(skip, 10) || 0;
    const limits = parseInt(limit, 10) || 1000;
    const loginId = req.user.sub;
    if (!loginId) {
      throw new BadRequestException("Unauthorized to view Meetings");
    }

    const { meetings, totalCount, allCount } = await this.meetingService.all(
      loginId,
      skips,
      limits,
      startScheduleDate,
      endScheduleDate
    );

    return { meetings, totalCount, allCount };
  }
}
