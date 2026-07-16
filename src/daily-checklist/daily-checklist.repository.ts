import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, ObjectId } from "mongoose";
import { CheckList } from "./daily-checklist.schema";
import { CheckListDto } from "./daily-checklist.dto";
// import { Task } from '../task/task.schema';
@Injectable()
export class CheckListRepository {
  constructor(
    @InjectModel(CheckList.name)
    private readonly checkListModel: Model<CheckList>,
  ) {}

  async createCheckList(
    dto: CheckListDto,
    id?: string,
  ): Promise<ObjectId | string> {
    try {
      if (id) {
        await this.checkListModel.updateOne({ _id: id }, { $set: dto }).exec();
        return id as unknown as ObjectId;
      } else {
        const created = new this.checkListModel(dto);
        const result = await created.save();
        return result._id;
      }
    } catch (error) {
      console.error("Failed to create or update CheckLis:", error);
      throw error;
    }
  }

  async getCheckListWithTwoLatestDates(
    userId: string,
  ): Promise<{
    checkList: CheckListDto[];
    featureList: CheckListDto[];
    totalCount: number;
  }> {
    try {
      // Step 1: Get the two latest unique date parts from `createdDate` string
      const latestDates = await this.checkListModel.aggregate([
        { $match: { userId } },
        {
          $project: {
            dateOnly: { $substr: ["$createdDate", 0, 10] }, // "YYYY-MM-DD"
          },
        },
        { $group: { _id: "$dateOnly" } },
        { $sort: { _id: -1 } }, // latest dates first
        { $limit: 2 },
      ]);

      console.log("latestDates latestDates", latestDates);
      if (!latestDates.length) {
        return { checkList: [], featureList: [], totalCount: 0 };
      }

      // Step 2: Build date range filters for each of the two days
      const dateFilters = latestDates.map(({ _id: day }) => {
        const from = `${day}T00:00:00`;
        const to = `${day}T23:59:59`;
        return { createdDate: { $gte: from, $lte: to } };
      });
      console.log("dateFilters dateFilters", dateFilters);
      // Step 3: Query with $or for those two days
      const filters: any = {
        userId,
        $or: dateFilters,
      };

      const [checkList, featureList, totalCount] = await Promise.all([
        this.checkListModel
          .find(filters)
          .sort({ createdDate: -1, _id: -1 })
          .select("-__v -createdAt -updatedAt")
          .lean()
          .exec(),
        this.checkListModel
          .find({ userId, isFeature: true })
          .sort({ _id: -1 })
          .select("-__v -createdAt -updatedAt")
          .lean()
          .skip(0)
          .limit(100)
          .exec(),
        this.checkListModel.countDocuments({ userId }).exec(),
      ]);

      return { checkList, featureList, totalCount };
    } catch (error) {
      console.error("Failed to get checklist:", error);
      throw new Error("Could not fetch checklist");
    }
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
    const filters: any = { userId };

    if (task) {
      filters.task = { $regex: task, $options: "i" };
    }

    if (typeof status === "boolean") {
      filters.status = status;
    }

    if (createdDateFrom || createdDateTo) {
      filters.createdAt = {};

      if (createdDateFrom) {
        filters.createdAt.$gte = createdDateFrom;
      }

      if (createdDateTo) {
        filters.createdAt.$lt = createdDateTo;
      }
    }

    try {
      const [checkList, totalCount] = await Promise.all([
        this.checkListModel
          .find(filters)
          .sort({ _id: -1 })
          .select("-__v -createdAt -updatedAt")
          .lean()
          .skip(skip)
          .limit(limit)
          .exec(),

        this.checkListModel.countDocuments(filters).exec(),
      ]);

      return { checkList, totalCount };
    } catch (error) {
      console.error("Failed to get checklist:", error);
      throw new Error("Could not fetch checklist");
    }
  }

  async deleteCheckList(userId: string, id: string): Promise<ObjectId> {
    try {
      const result = await this.checkListModel
        .findOneAndDelete({
          _id: id,
          userId,
        })
        .exec();

      if (!result) {
        throw new Error("Checklist not found or does not belong to the user");
      }
      return result._id;
    } catch (error) {
      console.error("Failed to delete Checklist:", error);
      throw error;
    }
  }
}
