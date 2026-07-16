import { Injectable, NotFoundException } from "@nestjs/common";
import { BreakDto } from "./break.dto";
import { GCDto } from "./googleCalendar.dto";
import { InjectModel } from "@nestjs/mongoose";
import { ObjectId } from "mongodb";
import { Break } from "./break.schema";
import { Model } from "mongoose";
import { Admin } from "../admin/admin.schema";
import { User } from "../user-auth/api/user/model/user.schema";
import { formatTimeToIsoDate } from "../utils/utils";
import { GoogleCalendarService } from "../google-calendar/google-calendar.service";
import { mapGoogleEventToBreakDto } from "../google-calendar/google-calendar.utils";

@Injectable()
export class BreakRepository {
  constructor(
    @InjectModel(Break.name) private readonly breakModel: Model<Break>,
    @InjectModel(Admin.name) private readonly adminModel: Model<Admin>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly googleCalendarService: GoogleCalendarService,
  ) { }

  async createBreak(
    breakDto: BreakDto,
    loginId: string,
    id?: string,
    googleRefreshToken?: string,
  ): Promise<ObjectId> {
    try {
      let breakRecord: Break;
      const { isTimeTracker, ...cleanDto } = breakDto;
      const crtdDate = new Date(cleanDto.createdDate);
      if (id) {
        cleanDto.updatedDate = new Date();
        const existingBreak = await this.breakModel.findById(id).exec();
        if (!existingBreak) {
          throw new NotFoundException(`Break with id ${id} not found.`);
        }
        if (isTimeTracker && existingBreak.isClosed) {
          throw new NotFoundException("Break is already closed.");
        }
        existingBreak.set(cleanDto);
        await existingBreak.save();
        breakRecord = existingBreak;
        // Sync update to Google Calendar
        if (existingBreak.googleEventId) {
          try {
            if (googleRefreshToken) {
              await this.googleCalendarService.updateCalendarEvent(
                googleRefreshToken,
                existingBreak.googleEventId,
                {
                  endTime: formatTimeToIsoDate(cleanDto.endTime, new Date(crtdDate.getTime() + (cleanDto.duration || 15) * 60000), cleanDto.timezone),
                  summary: `☕ ${cleanDto.type}`,
                  description: cleanDto.reason,
                  startTime: formatTimeToIsoDate(cleanDto.startTime, crtdDate, cleanDto.timezone),
                  timeZone: cleanDto.timezone
                }
              );
            }
          } catch (calErr) {
            console.error("Failed to update Google Calendar event for break:", calErr);
          }
        } else if (googleRefreshToken && breakRecord.isClosed) {
          // If no event exists yet (e.g. started via time tracker) and it's now closed, create it
          try {
            let colorId = '10'; // Green
            let extendedProperties: any = {
              private: {
                workBreakType: 'break',
                type: 'break',
                origin: 'Work-Break-App'
              }
            };

            const googleEvent = await this.googleCalendarService.createCalendarEvent(googleRefreshToken, {
              summary: `☕ ${cleanDto.type}`,
              description: cleanDto.reason,
              startTime: formatTimeToIsoDate(cleanDto.startTime, crtdDate, cleanDto.timezone),
              endTime: formatTimeToIsoDate(cleanDto.endTime, new Date(crtdDate.getTime() + (cleanDto.duration || 15) * 60000), cleanDto.timezone),
              colorId,
              extendedProperties,
              timeZone: cleanDto.timezone
            });

            if (googleEvent && googleEvent.id) {
              breakRecord.googleEventId = googleEvent.id;
              await breakRecord.save();
            }
          } catch (calErr) {
            console.error("Failed to create Google Calendar event for break on update:", calErr);
          }
        }
      } else {
        // Create new break record
        cleanDto.updatedDate = new Date();
        const newBreak = new this.breakModel(cleanDto);
        breakRecord = await newBreak.save();

        // Sync to Google Calendar
        try {
          if (googleRefreshToken && (!isTimeTracker || cleanDto.isClosed)) {
            let colorId = '10'; // Green
            let extendedProperties: any = {
              private: {
                workBreakType: 'break',
                break: 'break',
                origin: 'Work-Break-App'
              }
            };

            const googleEvent = await this.googleCalendarService.createCalendarEvent(googleRefreshToken, {
              summary: `☕ ${cleanDto.type}`,
              description: cleanDto.reason,
              startTime: formatTimeToIsoDate(cleanDto.startTime, crtdDate, cleanDto.timezone),
              endTime: formatTimeToIsoDate(cleanDto.endTime, new Date(crtdDate.getTime() + (cleanDto.duration || 15) * 60000), cleanDto.timezone),
              colorId,
              extendedProperties,
              timeZone: cleanDto.timezone
            });

            if (googleEvent && googleEvent.id) {
              breakRecord.googleEventId = googleEvent.id;
              await breakRecord.save();
            }
          }
        } catch (calErr) {
          console.error("Failed to create Google Calendar event for break:", calErr);
        }
      }

      // if the break is runing and user add a new break from modal
      if (isTimeTracker) {
        const adminUpdated = await this.updateStatusInAdminCollection(
          cleanDto.userId,
          breakDto.isClosed,
        );
        if (!adminUpdated) {
          await this.breakModel.findByIdAndDelete(breakRecord._id);
          throw new Error("Failed to update Admin status, rollback performed.");
        }
      }

      return breakRecord._id;
    } catch (error) {
      console.error("Failed to create break:", error);
      throw error;
    }
  }

  async updateStatusInAdminCollection(
    userId: string,
    isBreakClosed: boolean,
  ): Promise<boolean> {
    try {
      const existingUser = await this.adminModel.findOne({ userId: userId });
      if (!existingUser) return true; // Ignore if userId does not exist
      const status = isBreakClosed ? "Closed" : "Inprogress";
      const result = await this.adminModel.updateMany(
        { userId },
        { $set: { status } },
      );
      if (!result) {
        throw new Error("Admin not found");
      }
      return true;
    } catch (error) {
      console.error("Failed to update Admin status:", error);
      return false;
    }
  }

  async amITheAdmin(userId: string, adminId: string): Promise<boolean> {
    try {
      const existingUser = await this.adminModel.findOne({
        userId,
        adminId,
        isAccepted: true,
      });
      return !!existingUser;
    } catch (error) {
      console.error("Failed to get Admin user:", error);
      return false;
    }
  }

  async getBreaks(
    userId: string,
    isToday: boolean,
    isMonthly: boolean,
    onCreatedDate: string,
    fourWeekDateRange: string,
  ): Promise<BreakDto[]> {
    try {
      if (isToday) {
        // Fetch today's breaks with isClosed filter
        const breaksToday = await this.breakModel
          .find({
            userId,
            isClosed: true,
            createdDate: onCreatedDate,
          })
          .sort({ _id: -1 })
          .select("-__v")
          .lean()
          .exec();

        return breaksToday;
      }

      if (isMonthly) {
        const monthly = await this.breakModel
          .find({
            userId,
            isClosed: true,
            createdDate: {
              $gte: fourWeekDateRange,
              $lte: onCreatedDate,
            },
          })
          .sort({ createdDate: -1 })
          .select("-__v")
          .lean()
          .exec();

        return monthly;
      }

      return [];
    } catch (error) {
      console.error("Failed to get breaks:", error);
      throw error;
    }
  }

  async todayBreaks(
    userId: string,
    todayCreatedDate: string,
  ): Promise<BreakDto[]> {
    try {
      const breaksToday = await this.breakModel
        .find({
          userId,
          isClosed: true,
          createdDate: todayCreatedDate,
        })
        .sort({ _id: -1 })
        .select("-__v")
        .lean()
        .exec();
      if (!breaksToday || breaksToday.length === 0) {
        return [];
      }
      return breaksToday;
    } catch (error) {
      console.error("Failed to get breaks:", error);
      throw error;
    }
  }

  async getGoogleCalendarRecords(
  startDate: string,
  endDate: string,
  timeZone: string,
  googleRefreshToken: string
): Promise<GCDto[]> {
  try {
    
    const events = await this.googleCalendarService.getCalendarEvents(
      googleRefreshToken,
      startDate,
      endDate,
      timeZone,
      100,
    );

    return events
      .filter(evt => {
        const isFromApp =
          evt.extendedProperties?.private?.origin === 'Work-Break-App';

        const hasAttendees =
          evt.attendees && evt.attendees.length > 0;

        return !isFromApp && !hasAttendees;
      })
      .map(evt => mapGoogleEventToBreakDto(evt));

  } catch (calErr) {
    console.error('Failed to fetch Google Calendar events:', calErr);
    return [];
  }
}

  async getArchivesBreaks(
    userId: string,
    skip: number,
    limit: number,
    type: string,
    createdDateFrom: string | null,
    createdDateTo: string | null,
  ): Promise<{ breaks: BreakDto[]; totalCount: number; allCount: number }> {
    const filters: any = { userId, isClosed: true };

    if (type) {
      filters.type = type;
    }

    if (createdDateFrom || createdDateTo) {
      filters.createdDate = {};
      if (createdDateFrom) {
        filters.createdDate.$gte = createdDateFrom;
      }
      if (createdDateTo) {
        filters.createdDate.$lt = createdDateTo;
      }
    }

    try {
      const [breaks, totalCount, allCount] = await Promise.all([
        // Fetch paginated breaks based on search criteria
        this.breakModel
          .find(filters)
          .sort({ createdDate: -1, _id: 1 })
          .select("-__v")
          .lean()
          .skip(skip)
          .limit(limit)
          .exec(),
        this.breakModel.countDocuments(filters).exec(),
        this.breakModel.countDocuments({ userId, isClosed: true }).exec(),
      ]);

      return {
        breaks,
        totalCount,
        allCount,
      };
    } catch (error) {
      console.error("Failed to get breaks:", error);
      throw error;
    }
  }

  async deleteBreak(userId: string, id: string, googleRefreshToken?: string): Promise<ObjectId> {
    try {
      const result = await this.breakModel
        .findByIdAndDelete({ _id: id, userId })
        .exec();
      if (!result) {
        throw new Error("Break not found");
      }
      await this.updateStatusInAdminCollection(userId, true);

      // Sync to Google Calendar
      if (result.googleEventId) {
        try {
          if (googleRefreshToken) {
            await this.googleCalendarService.deleteCalendarEvent(
              googleRefreshToken,
              result.googleEventId
            );
          }
        } catch (calErr) {
          console.error("Failed to delete Google Calendar event:", calErr);
        }
      }

      return result._id;
    } catch (error) {
      console.error("Failed to delete break:", error);
      throw error;
    }
  }

  async getSingleBreak(
    userId: string,
    isClosed: boolean
  ): Promise<BreakDto | undefined> {
    try {
      const result = await this.breakModel
        .findOne({ isClosed, userId })
        .select("-__v")
        .lean()
        .exec();
      if (!result) {
        return undefined;
      }
      return result;
    } catch (error) {
      console.error("Failed to get single break:", error);
    }
  }
}