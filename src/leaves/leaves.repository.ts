import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, ObjectId } from "mongoose";
import { Leaves } from "./leaves.schema";
import { LeavesDto } from "./leaves.dto";
import { Admin } from "../admin/admin.schema";

@Injectable()
export class LeavesRepository {
  constructor(
    @InjectModel(Leaves.name) private readonly leavesModel: Model<Leaves>,
    @InjectModel(Admin.name) private readonly adminModel: Model<Admin>,
  ) {}
  async createLeaves(
    leavesDto: LeavesDto,
    id?: string,
  ): Promise<ObjectId | string> {
    try {
      // Ensure $and is always an array
      const leaveQuery: any = {
        $and: [
          { userId: leavesDto.userId }, // Ensure only the specific user's data is checked
          {
            $or: [
              {
                fromDate: { $lte: leavesDto.toDate },
                toDate: { $gte: leavesDto.fromDate },
              }, // Overlap check
              {
                fromDate: { $gte: leavesDto.fromDate, $lte: leavesDto.toDate },
              }, // Falls within range
              { toDate: { $gte: leavesDto.fromDate, $lte: leavesDto.toDate } }, // Falls within range
            ],
          },
        ],
      };

      if (id) {
        // Exclude the current record when checking for overlapping leaves
        leaveQuery.$and.push({ _id: { $ne: id } });
        const existingLeave = await this.leavesModel.findOne(leaveQuery);
        if (existingLeave) {
          throw new NotFoundException(
            "You’ve already scheduled leave for one or more days in the selected range.",
          );
        }
        await this.leavesModel
          .updateOne({ _id: id }, { $set: leavesDto })
          .exec();
        return id as unknown as ObjectId;
      } else {
        // Check for overlapping leave when creating a new leave request
        const existingLeave = await this.leavesModel.findOne(leaveQuery);
        if (existingLeave) {
          throw new NotFoundException(
            "You’ve already scheduled leave for one or more days in the selected range.",
          );
        }
        const createdLeaves = new this.leavesModel(leavesDto);
        const result = await createdLeaves.save();
        return result._id;
      }
    } catch (error) {
      console.error("Failed to create or update Leaves:", error);
      throw error;
    }
  }
  async getLeaves(
    userId: string,
    skip: number,
    limit: number,
    fromDate?: string,
    toDate?: string,
  ): Promise<{ leaves: LeavesDto[]; totalCount: number; allCount: number }> {
    try {
      const filter: any = { userId };

      // Add date range filter if fromDate and toDate are provided
      if (fromDate || toDate) {
        filter.fromDate = {};
        if (fromDate) filter.fromDate.$gte = fromDate;
        if (toDate) filter.fromDate.$lte = toDate;
      }

      const [leaves, totalCount, allCount] = await Promise.all([
        this.leavesModel
          .find(filter)
          .sort({ fromDate: 1 })
          .select("-__v -createdAt -updatedAt")
          .lean()
          .skip(skip)
          .limit(limit)
          .exec(),
        this.leavesModel.countDocuments(filter).exec(),
        this.leavesModel.countDocuments({ userId }).exec(),
      ]);

      return { leaves, totalCount, allCount };
    } catch (error) {
      console.error("Failed to get Leaves:", error);
      throw error;
    }
  }

  async isOnLeave(userId: string, todayDate: string): Promise<boolean> {
    try {
      const leave = await this.leavesModel
        .findOne({
          userId,
          fromDate: { $lte: todayDate },
          toDate: { $gte: todayDate },
        })
        .lean();

      return !!leave; // true if found, false otherwise
    } catch (error) {
      console.error("Failed to check leave:", error);
      throw error;
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

  async deleteLeaves(userId: string, id: string): Promise<ObjectId> {
    try {
      const result = await this.leavesModel
        .findByIdAndDelete({ _id: id, userId })
        .exec();
      if (!result) {
        throw new Error("Leaves not found");
      }
      return result._id;
    } catch (error) {
      console.error("Failed to delete Leaves:", error);
      throw error;
    }
  }
}