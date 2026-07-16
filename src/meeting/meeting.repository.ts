import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, ObjectId } from "mongoose";
import { Meeting } from "./meeting.schema";
import { MeetingDto } from "./meeting.dto";
import { Admin } from "../admin/admin.schema";
import { GoogleCalendarService } from "../google-calendar/google-calendar.service";
import { formatTimeToIsoDate } from "../utils/utils";

@Injectable()
export class MeetingRepository {
  constructor(
    @InjectModel(Meeting.name) private readonly meetingModel: Model<Meeting>,
    @InjectModel(Admin.name) private readonly adminModel: Model<Admin>,
    private readonly googleCalendarService: GoogleCalendarService,
  ) { }

  async createMeeting(
    meetingDto: MeetingDto,
    id?: string,
    googleRefreshToken?: string
  ): Promise<ObjectId> {
    try {
      const scheduleDateObj = new Date(meetingDto.scheduleDate);

      if (id) {
        const existingMeeting = await this.meetingModel.findById(id).exec();
        if (!existingMeeting) {
          throw new NotFoundException(`Meeting with id ${id} not found.`);
        }
        existingMeeting.set(meetingDto);
        await existingMeeting.save();

        // Sync update to Google Calendar
        if (existingMeeting.googleEventId && googleRefreshToken) {
          try {
            await this.googleCalendarService.updateCalendarEvent(
              googleRefreshToken,
              existingMeeting.googleEventId,
              {
                startTime: formatTimeToIsoDate(meetingDto.from, scheduleDateObj, meetingDto.timezone),
                endTime: formatTimeToIsoDate(meetingDto.to, scheduleDateObj, meetingDto.timezone),
                summary: `🤝 ${meetingDto.description}`,
                description: meetingDto.description,
                timeZone: meetingDto.timezone,
              }
            );
          } catch (calErr) {
            console.error("Failed to update Google Calendar event for meeting:", calErr);
          }
        }
        return id as unknown as ObjectId;
      } else {
        const createdMeeting = new this.meetingModel(meetingDto);
        const result = await createdMeeting.save();

        // Sync to Google Calendar
        if (googleRefreshToken) {
          try {
            const googleEvent = await this.googleCalendarService.createCalendarEvent(googleRefreshToken, {
              summary: `🤝 ${meetingDto.description}`,
              description: meetingDto.description,
              startTime: formatTimeToIsoDate(meetingDto.from, scheduleDateObj, meetingDto.timezone),
              endTime: formatTimeToIsoDate(meetingDto.to, scheduleDateObj, meetingDto.timezone),
              colorId: '11', // Red for meetings
              extendedProperties: {
                private: {
                  workBreakType: 'meeting',
                  type: 'meeting',
                  origin: 'Work-Break-App'
                }
              },
              timeZone: meetingDto.timezone,
            });

            if (googleEvent && googleEvent.id) {
              result.googleEventId = googleEvent.id;
              await result.save();
            }
          } catch (calErr) {
            console.error("Failed to create Google Calendar event for meeting:", calErr);
          }
        }
        return result._id;
      }
    } catch (error) {
      console.error("Failed to create or update Meeting:", error);
      throw error;
    }
  }

  async getMeetings(
    userId: string,
    todayScheduledDate: string,
    isToday: boolean
  ): Promise<MeetingDto[]> {
    try {
      let filter: any = { userId };

      if (isToday) {
        filter.scheduleDate = todayScheduledDate;
      } else {
        // Future meetings (today and beyond)
        filter.scheduleDate = { $gte: todayScheduledDate };
      }

      const result = await this.meetingModel
        .find(filter)
        .sort({ scheduleDate: -1, from: 1 })
        .select("-__v -createdAt -updatedAt")
        .lean()
        .exec() as MeetingDto[];

      return result || [];
    } catch (error) {
      console.error("Failed to get Meetings:", error);
      throw error;
    }
  }

  async all(
    userId: string,
    skip: number,
    limit: number,
    startScheduleDate: string,
    endScheduleDate: string,
  ): Promise<{ meetings: MeetingDto[]; totalCount: number; allCount: number }> {
    const filters: any = { userId };

    if (startScheduleDate || endScheduleDate) {
      filters.scheduleDate = {};
      if (startScheduleDate) {
        filters.scheduleDate.$gte = startScheduleDate;
      }
      if (endScheduleDate) {
        filters.scheduleDate.$lt = endScheduleDate;
      }
    }

    try {
      const [meetings, totalCount, allCount] = await Promise.all([
        this.meetingModel
          .find(filters)
          .sort({ scheduleDate: -1, from: 1 })
          .select("-__v -createdAt -updatedAt")
          .lean()
          .skip(skip)
          .limit(limit)
          .exec(),
        this.meetingModel.countDocuments(filters).exec(),
        this.meetingModel.countDocuments({ userId }).exec(),
      ]);

      return {
        meetings,
        totalCount,
        allCount,
      };
    } catch (error) {
      console.error("Failed to get Meetings:", error);
      throw error;
    }
  }

  async deleteMeeting(userId: string, id: string, googleRefreshToken?: string): Promise<ObjectId> {
    try {
      const result = await this.meetingModel
        .findByIdAndDelete({ _id: id, userId })
        .exec();
      if (!result) {
        throw new Error("Meeting not found");
      }

      // Sync to Google Calendar
      if (result.googleEventId && googleRefreshToken) {
        try {
          await this.googleCalendarService.deleteCalendarEvent(
            googleRefreshToken,
            result.googleEventId
          );
        } catch (calErr) {
          console.error("Failed to delete Google Calendar event for meeting:", calErr);
        }
      }

      return result._id;
    } catch (error) {
      console.error("Failed to delete Meeting:", error);
      throw error;
    }
  }
}