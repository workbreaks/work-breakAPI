import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, ObjectId } from "mongoose";
import { Admin } from "./admin.schema";
import { AdminDto } from "./admin.dto";
import { Break } from "../break/break.schema";
import { OnBreak } from "./interfaces/on_break";
import { Leaves } from "../leaves/leaves.schema";
import { User, UserDocument } from "../user-auth/api/user/model/user.schema";
import { MyAdmins } from "./interfaces/my_admins";

@Injectable()
export class AdminRepository {
  constructor(
    @InjectModel(Admin.name) private readonly adminModel: Model<Admin>,
    @InjectModel(Break.name) private readonly breakModel: Model<Break>,
    @InjectModel(Leaves.name) private readonly leaveModel: Model<Leaves>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async addUser(adminDto: AdminDto): Promise<ObjectId> {
    try {
      adminDto.createdDate = new Date();
      const createdAdmin = new this.adminModel(adminDto);
      const result = await createdAdmin.save();
      return result._id as unknown as ObjectId;
    } catch (error) {
      console.error("Failed to create or update Admin:", error);
      throw error; // Propagate the error to the caller
    }
  }

  async updateUserAcceptedField(
    userId: string,
    adminId: string,
  ): Promise<ObjectId> {
    try {
      const response = await this.adminModel.updateOne(
        { userId, adminId },
        {
          $set: { isAccepted: true },
        },
      );
      return response as any;
    } catch (error) {
      console.error("Failed to create or update Admin:", error);
      throw error;
    }
  }

  async getUsersCounts(adminId: string): Promise<number> {
    try {
      const count = await this.adminModel.countDocuments({ adminId }).exec();
      return count;
    } catch (error) {
      console.error("Failed to get user count:", error);
      throw error;
    }
  }

  async getUSers(adminId: string): Promise<Admin[]> {
    try {
      const result = await this.adminModel
        .find({
          adminId,
        })
        .select("name email userId status isAccepted")
        .sort({ _id: -1 })
        .exec();
      return result;
    } catch (error) {
      console.error("Failed to get Admin:", error);
      throw error;
    }
  }

  async getOnBreak(adminId: string): Promise<OnBreak[]> {
    try {
      // Step 1: Fetch users with status "Inprogress" and isAccepted: true
      const users = await this.adminModel
        .find(
          {
            adminId: new Object(adminId),
            status: "Inprogress",
            isAccepted: true,
          },
          { name: 1, email: 1, userId: 1 },
        )
        .lean();

      if (!users.length) {
        return []; // No users found
      }
      const userIds = users.map((user) => user.userId);

      // Step 3: Fetch active breaks for these userIds
      const breaks = await this.breakModel
        .find(
          { userId: { $in: userIds }, isClosed: false },
          { userId: 1, type: 1, reason: 1, createdDate: 1, startTime: 1 },
        )
        .lean();

      if (!breaks.length) {
        return []; // No active breaks found
      }

      const userMap = new Map(users.map((user) => [user.userId, user]));
      const mergedData = breaks.map((breakItem) => ({
        userId: breakItem.userId,
        name: userMap.get(breakItem.userId)?.name,
        email: userMap.get(breakItem.userId)?.email,
        type: breakItem.type,
        reason: breakItem.reason,
        createdDate: breakItem.createdDate,
        startTime: breakItem.startTime,
      }));

      const sortedMergedData = mergedData.sort((a, b) =>
        a.name?.localeCompare(b.name),
      );

      return sortedMergedData;
    } catch (error) {
      console.error("Failed to get Admin on break:", error);
      throw error;
    }
  }

  async getOnLeaves(adminId: string, todayDate: string): Promise<any[]> {
    try {
      // Step 1: Fetch users with status "Inprogress" and isAccepted: true
      const users = await this.adminModel
        .find(
          { adminId: new Object(adminId), isAccepted: true },
          { name: 1, email: 1, userId: 1 },
        )
        .lean();

      if (!users.length) {
        return []; // No users found
      }

      const userIds = users.map((user) => user.userId);

      // Step 2: Fetch leave records where today is within fromDate and toDate range
      const leaves = await this.leaveModel
        .find(
          {
            userId: { $in: userIds },
            fromDate: { $lte: todayDate }, // Leave started before or on today
            toDate: { $gte: todayDate }, // Leave ends after or on today
          },
          { userId: 1, reason: 1, fromDate: 1, toDate: 1 },
        )
        .lean();

      if (!leaves.length) {
        return []; // No active leaves today
      }

      // Step 3: Merge user data with leave details
      const userMap = new Map(users.map((user) => [user.userId, user]));
      const mergedData = leaves.map((leaveItem) => ({
        userId: leaveItem.userId,
        name: userMap.get(leaveItem.userId)?.name || "",
        email: userMap.get(leaveItem.userId)?.email || "",
        reason: leaveItem.reason,
        fromDate: leaveItem.fromDate,
        toDate: leaveItem.toDate,
      }));

      const sortedMergedData = mergedData.sort((a, b) =>
        a.name?.localeCompare(b.name),
      );
      return sortedMergedData;
    } catch (error) {
      console.error("Failed to get users on leave:", error);
      throw error;
    }
  }

  async deleteUser(
    email: string,
    isAdmin: string,
    requesterId: string,
  ): Promise<ObjectId> {
    try {
      const isAdminBool = isAdmin === "true";
      const query: any = { email };

      if (isAdminBool) {
        query.adminId = requesterId;
      } else {
        query.userId = requesterId;
      }
      const result = await this.adminModel.findOneAndDelete(query).exec();
      if (!result) {
        throw new Error("Not authorized or admin not found");
      }

      return result._id as unknown as ObjectId;
    } catch (error) {
      console.error("Failed to delete Admin:", error);
      throw error;
    }
  }

  async updateName(name: string, userId: string): Promise<ObjectId> {
    try {
      const result = await this.adminModel
        .updateOne({ userId }, { $set: { name } })
        .exec();
      return result.upsertedId as unknown as ObjectId;
    } catch (error) {
      console.error("Failed to delete Admin:", error);
      throw error;
    }
  }

  async updateEmail(email: string, userId: string): Promise<ObjectId> {
    try {
      const result = await this.adminModel
        .updateOne({ userId }, { $set: { email } })
        .exec();
      return result.upsertedId as unknown as ObjectId;
    } catch (error) {
      console.error("Failed to delete Admin:", error);
      throw error;
    }
  }

  async myAdmin(email: string, userId: string): Promise<MyAdmins[]> {
    try {
      const admins = await this.adminModel.find(
        { userId, email },
        { adminId: 1, isAccepted: 1 },
      );
      const result = await Promise.all(
        admins.map(async (admin) => {
          const user = await this.userModel.findById(admin.adminId, {
            name: 1,
            email: 1,
          }).lean();

          return {
            adminId: admin.adminId,
            isAccepted: admin.isAccepted,
            name: user?.name || '',
            email: user?.email || '',
          };
        }),
      );
      return result;
    } catch (error) {
      console.error("Failed to get myAdmin:", error);
      throw error;
    }
  }
}
