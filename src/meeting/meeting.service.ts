import { Injectable } from "@nestjs/common";
import { MeetingDto } from "./meeting.dto";
import { MeetingRepository } from "./meeting.repository";
import { ObjectId } from "mongoose";

@Injectable()
export class MeetingService {
  constructor(private readonly meetingRepository: MeetingRepository) {}

  async createMeeting(
    meetingDto: MeetingDto,
    mongoId: string | undefined,
    googleRefreshToken?: string,
  ): Promise<ObjectId> {
    const id = await this.meetingRepository.createMeeting(meetingDto, mongoId, googleRefreshToken);
    return id;
  }

  async deleteMeeting(userId: string, mongoId: string, googleRefreshToken?: string): Promise<ObjectId> {
    const id = await this.meetingRepository.deleteMeeting(userId, mongoId, googleRefreshToken);
    return id;
  }

  async getMeetings(
    userId: string,
    todayScheduledDate: string,
    isToday: boolean
  ): Promise<MeetingDto[]> {
    const meetings = await this.meetingRepository.getMeetings(
      userId,
      todayScheduledDate,
      isToday,
    );
    return meetings;
  }

  async all(
    userId: string,
    skips: number,
    limits: number,
    startScheduleDate: string,
    endScheduleDate: string,
  ): Promise<{ meetings: MeetingDto[]; totalCount: number; allCount: number }> {
    const { meetings, totalCount, allCount } = await this.meetingRepository.all(
      userId,
      skips,
      limits,
      startScheduleDate,
      endScheduleDate
    );
    return { meetings, totalCount, allCount };
  }
}
