import {
  Body,
  Controller,
  Post,
  Get,
  Put,
  Query,
  Param,
  Request,
  UseGuards,
  Delete,
  BadRequestException,
} from "@nestjs/common";
import { BreakDto } from "./break.dto";
import { BreakService } from "./break.service";
import { ObjectId } from "mongodb";
import { JwtAuthGuard } from "../user-auth/api/auth/jwt-auth.gaurd";
import { GetBreaksDto } from "./get-break.dto";
import { GCDto } from "./googleCalendar.dto";

@UseGuards(JwtAuthGuard)
@Controller("break")
export class BreakController {
  constructor(private readonly breakService: BreakService) {}

  @Post("add")
  async createBreak(
    @Body() breakDto: BreakDto,
    @Request() req,
  ): Promise<ObjectId> {
    const loginId = req.user?.sub;
    if (!loginId || breakDto.userId !== loginId) {
      throw new BadRequestException("Unauthorized to add Breaks");
    }
    const insertedId = await this.breakService.createBreak(
      breakDto,
      req.user.sub,
      undefined,
      req.user.googleRefreshToken,
    );
    return insertedId;
  }

  @Put("edit/:id")
  async editBreak(
    @Param("id") id: string,
    @Body() breakDto: BreakDto,
    @Request() req,
  ): Promise<ObjectId> {
    if (breakDto.userId !== req.user.sub) {
      throw new BadRequestException("Unauthorized to edit Breaks");
    }
    const insertedId = await this.breakService.createBreak(
      breakDto,
      req.user.sub,
      id,
      req.user.googleRefreshToken,
    );
    return insertedId;
  }

  @Get("get")
  async getBreaks(
    @Query() query: GetBreaksDto,
    @Request() req,
  ): Promise<BreakDto[]> {
    const { isToday, isMonth, onCreatedDate, fourWeekDateRange } = query;
    const userId = req.user.sub;
    const isTodayBoolean = JSON.parse(isToday.toLowerCase());
    const isMonthly = JSON.parse(isMonth.toLowerCase());
    const breaks = await this.breakService.getBreaks(
      userId,
      isTodayBoolean,
      isMonthly,
      onCreatedDate,
      fourWeekDateRange
    );
    return breaks;
  }

  @Get("todayBreaks")
  async todayBreaks(
    @Query("todayCreatedDate") todayCreatedDate: string,
    @Request() req,
  ): Promise<BreakDto[]> {
    const userId = req.user.sub;
    const breaks = await this.breakService.todayBreaks(
      userId,
      todayCreatedDate
    );
    return breaks;
  }

  @Get("getGoogleCalendarRecords")
  async getGoogleCalendarRecords(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Query('timeZone') timeZone: string,
    @Request() req,
  ): Promise<GCDto[]> {
    const breaks = await this.breakService.getGoogleCalendarRecords(
      startDate,
      endDate,
      timeZone,
      req.user.googleRefreshToken,
    );
    return breaks;
  }

  @Get("getArchivesBreaks")
  async getArchivesBreaks(
    @Query("id") id: string,
    @Request() req,
    @Query("skip") skip: any,
    @Query("limit") limit: any,
    @Query("type") type?: string,
    @Query("createdDateFrom") createdDateFrom?: string,
    @Query("createdDateTo") createdDateTo?: string,
    @Query("userId") userId?: string,
  ): Promise<{ breaks: BreakDto[]; totalCount: number; allCount: number }> {
    const loginId = req.user.sub;
    if (id !== loginId) {
      throw new BadRequestException("Unauthorized to view Breaks");
    }
    const isAbleToView = await this.breakService.amITheAdmin(userId, loginId);
    // hack case, user not accpted to admin and user somehow hack and try
    if (!isAbleToView && userId) {
      throw new BadRequestException("Unauthorized to view Breaks");
    }
    let breaksId = userId;
    // same user looking his own break
    if (!isAbleToView && !userId) {
      breaksId = loginId;
    }
    // admin looking for the team members breaks
    if (isAbleToView && userId) {
      breaksId = userId;
    }

    const skips = parseInt(skip, 10) || 0;
    const limits = parseInt(limit, 10) || 1000000;
    const { breaks, totalCount, allCount } =
      await this.breakService.getArchivesBreaks(
        breaksId,
        skips,
        limits,
        type,
        createdDateFrom,
        createdDateTo
      );
    return { breaks, totalCount, allCount };
  }

  @Delete("delete/:id")
  async deleteBreak(
    @Param("id") id: string,
    @Request() req,
  ): Promise<ObjectId> {
    const insertedId = await this.breakService.deleteBreak(req.user.sub, id, req.user.googleRefreshToken);
    return insertedId;
  }

  //get single break
  @Get("get-break/:isClosed")
  async getSingleBreak(
    @Param("isClosed") isClosed: boolean,
    @Query("userId") userId: string,
    @Request() req,
  ): Promise<BreakDto | undefined> {
    const singleBreak = await this.breakService.getSingleBreak(
      userId,
      isClosed
    );
    return singleBreak;
  }
}
