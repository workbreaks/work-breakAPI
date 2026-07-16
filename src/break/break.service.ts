import { Injectable } from "@nestjs/common";
import { BreakDto } from "./break.dto";
import { GCDto } from "./googleCalendar.dto";
import { BreakRepository } from "./break.repository";
import { ObjectId } from "mongodb";

@Injectable()
export class BreakService {
  constructor(private readonly breakRepository: BreakRepository) {}

  async createBreak(
    breakDto: BreakDto,
    loginId: string,
    mongoId: string | undefined,
    googleRefreshToken?: string,
  ): Promise<ObjectId> {
    const id = await this.breakRepository.createBreak(
      breakDto,
      loginId,
      mongoId,
      googleRefreshToken,
    );
    return id;
  }

  async getBreaks(
    userId: string,
    isToday: boolean,
    isMonthly: boolean,
    onCreatedDate: string,
    fourWeekDateRange: string
  ): Promise<BreakDto[]> {
    const breaks = await this.breakRepository.getBreaks(
      userId,
      isToday,
      isMonthly,
      onCreatedDate,
      fourWeekDateRange
    );
    return breaks;
  }

  async todayBreaks(
    userId: string,
    todayCreatedDate: string
  ): Promise<BreakDto[]> {
    const breaks = await this.breakRepository.todayBreaks(
      userId,
      todayCreatedDate
    );
    return breaks;
  }

  async getGoogleCalendarRecords(
    startDate: string,
    endDate: string,
    timeZone: string,
    googleRefreshToken?: string,
  ): Promise<GCDto[]> {
    const breaks = await this.breakRepository.getGoogleCalendarRecords(
      startDate,
      endDate,
      timeZone,
      googleRefreshToken,
    );
    return breaks;
  }

  async deleteBreak(userId: string, mongoId: string, googleRefreshToken?: string): Promise<ObjectId> {
    const id = await this.breakRepository.deleteBreak(userId, mongoId, googleRefreshToken);
    return id;
  }

  async amITheAdmin(userId: string, adminId: string): Promise<boolean> {
    const response = await this.breakRepository.amITheAdmin(userId, adminId);
    return response;
  }

  async getSingleBreak(
    userId: string,
    isClosed: boolean
  ): Promise<BreakDto | undefined> {
    const singleBreak = await this.breakRepository.getSingleBreak(
      userId,
      isClosed,
    );
    return singleBreak;
  }

  async getArchivesBreaks(
    userId: string,
    skip: number,
    limit: number,
    type: string,
    createdDateFrom: string,
    createdDateTo: string
  ): Promise<{ breaks: BreakDto[]; totalCount: number; allCount: number }> {
    const { breaks, totalCount, allCount } =
      await this.breakRepository.getArchivesBreaks(
        userId,
        skip,
        limit,
        type,
        createdDateFrom,
        createdDateTo
      );
    return { breaks, totalCount, allCount };
  }
}
