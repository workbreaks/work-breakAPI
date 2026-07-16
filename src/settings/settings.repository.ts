import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "../user-auth/api/user/model/user.schema";
import { Task } from "../task/task.schema";
import { Break } from "../break/break.schema";
import { BreaksType } from "../break/type/breaks-type.schema";

@Injectable()
export class SettingsRepository {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(Break.name) private breakModel: Model<Break>,
    @InjectModel(BreaksType.name) private TypeModal: Model<BreaksType>,
  ) { }

  async getUserInfoWithCounts(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new Error("User not found");
    }

    const totalBreaksCount = await this.breakModel
      .countDocuments({
        userId,
      })
      .exec();

    const breakTypeDocument = await this.TypeModal.findOne({ userId }).exec();
    const breakTypes = breakTypeDocument ? breakTypeDocument.type : [];

    // Step 2: Count breaks for each type
    const breakTypeCounts = {};
    for (const type of breakTypes) {
      const count = await this.breakModel
        .countDocuments({ userId, type })
        .exec();
      breakTypeCounts[type] = count;
    }
    breakTypeCounts["totalCount"] = totalBreaksCount;

    const taskCounts = await this.taskModel
      .aggregate([
        { $match: { userId } }, // Match tasks for the specific user
        {
          $facet: {
            // Count by status
            byStatus: [
              {
                $group: {
                  _id: "$status",
                  count: { $sum: 1 },
                },
              },
            ],
            // Count by priority
            byPriority: [
              {
                $group: {
                  _id: "$priority",
                  count: { $sum: 1 },
                },
              },
            ],
            // Total task count
            total: [{ $count: "total" }],
          },
        },
      ])
      .exec();

    const taskCountsResult = {
      totalCount: taskCounts[0]?.total[0]?.total || 0,
      status: {}, // Separate section for status counts
      priority: {}, // Separate section for priority counts
    };

    // Map counts by status dynamically
    taskCounts[0].byStatus.forEach((status) => {
      taskCountsResult.status[status._id] = status.count;
    });

    // Map counts by priority dynamically
    taskCounts[0].byPriority.forEach((priority) => {
      taskCountsResult.priority[priority._id] = priority.count;
    });

    return {
      name: user.name,
      email: user.email,
      syncedEmail: user.syncedEmail || null,
      providerId: user.providerId || null,
      taskCounts: taskCountsResult,
      breakTypeCounts,
    };
  }

  async getTasksByPriorityAndStatus(userId: string): Promise<any> {
    const taskCounts = await this.taskModel
      .aggregate([
        { $match: { userId } }, // Match tasks for the specific user
        {
          $facet: {
            byPriority: [
              {
                $match: {
                  priority: { $in: ["Urgent", "Critical", "Important"] },
                },
              },
              {
                $group: {
                  _id: "$priority",
                  count: { $sum: 1 },
                },
              },
            ],
            byStatus: [
              {
                $match: {
                  status: { $in: ["To Do", "In Progress", "In Review"] },
                },
              },
              {
                $group: {
                  _id: "$status",
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },
      ])
      .exec();
    const taskCountsResult = {
      byPriority: {},
      byStatus: {},
    };

    // Map priority counts dynamically
    taskCounts[0].byPriority.forEach((priority) => {
      taskCountsResult.byPriority[priority._id] = priority.count;
    });

    // Map status counts dynamically
    taskCounts[0].byStatus.forEach((status) => {
      taskCountsResult.byStatus[status._id] = status.count;
    });

    return taskCountsResult;
  }

  async deleteAccount(userId: string): Promise<boolean> {
    try {
      const result = await this.userModel.updateOne(
        { _id: userId },
        { $set: { isDeleted: true } }, // Mark as deleted
      );
      console.error("result result:", result);
      // Check `nModified` for changes
      return result.modifiedCount === 1;
    } catch (error) {
      console.error("Error deleting account:", error);
      return false;
    }
  }
}
