import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, ObjectId } from "mongoose";
import { Task } from "./task.schema";
import { TaskDto } from "./task.dto";
import { Admin } from "../admin/admin.schema";
import { GoogleCalendarService } from "../google-calendar/google-calendar.service";

@Injectable()
export class TaskRepository {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<Task>,
    @InjectModel(Admin.name) private readonly adminModel: Model<Admin>,
    private readonly googleCalendarService: GoogleCalendarService,
  ) { }

  async createTask(
  taskDto: TaskDto,
  id?: string,
  googleRefreshToken?: string
): Promise<ObjectId> {
  // --- HELPER FUNCTION: Preserves Local Date & Timezone ---
 const formatTaskDueDate = (dateInput: any) => {
  const date = new Date(dateInput);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

  try {
    if (id) {
      const existingTask = await this.taskModel.findById(id).exec();
      if (!existingTask) {
        throw new NotFoundException(`Task with id ${id} not found.`);
      }
      
      taskDto.updatedDate = new Date();
      existingTask.set(taskDto);
      await existingTask.save();

      // Sync update to Google Calendar
      if (existingTask.googleEventId && googleRefreshToken) {
        try {
          // Use the local-aware string instead of .toISOString()
          const localDue = formatTaskDueDate(taskDto.scheduled);
          console.log("localDue localDue",localDue);
          await this.googleCalendarService.updateGoogleTask(
            googleRefreshToken,
            existingTask.googleEventId,
            {
              title: `📝 ${taskDto.title}`,
              notes: taskDto.description,
              due: localDue, // FIXED: Now stays on the correct day
              status: taskDto.status
            }
          );
        } catch (calErr) {
          console.error("Failed to update Google Calendar event for task:", calErr);
        }
      }
      return id as unknown as ObjectId;

    } else {
      taskDto.updatedDate = new Date();
      const createdTask = new this.taskModel(taskDto);
      const result = await createdTask.save();

      // Sync to Google Calendar
      if (googleRefreshToken) {
        try {
          // Use the local-aware string instead of .toISOString()
          const localDue = formatTaskDueDate(taskDto.scheduled);

          const googleTask = await this.googleCalendarService.createGoogleTask(googleRefreshToken, {
            title: `📝 ${taskDto.title || 'Work Task'}`,
            notes: taskDto.description || '✅ Automated via WorkBreak app',
            due: localDue, // FIXED: Now stays on the correct day
            status: taskDto.status === 'Completed' ? 'completed' : 'needsAction'
          });

          if (googleTask && googleTask.id) {
            result.googleEventId = googleTask.id;
            await result.save();
          }
        } catch (calErr) {
          console.error("Failed to create Google Calendar event for task:", calErr);
        }
      }
      return result._id;
    }
  } catch (error) {
    console.error("Failed to create or update task:", error);
    throw error;
  }
}

  async getTasks(
    userId: string,
    isScheduledBoolean: boolean,
    previousTwoWeeks: string,
    nextTwoWeeks: string,
  ): Promise<TaskDto[]> {
    try {
      if (isScheduledBoolean) {
        const result = await this.taskModel
          .find({
            userId,
            scheduled: { $gte: previousTwoWeeks, $lt: nextTwoWeeks },
          })
          .sort({ scheduled: -1 })
          .select("-__v")
          .lean()
          .exec();

        return result;
      }

      return []; // or handle unscheduled case
    } catch (error) {
      console.error("Failed to get tasks:", error);
      throw error;
    }
  }

  async todayTasks(
    userId: string,
    todayScheduledDate: string
  ): Promise<TaskDto[]> {
    try {
      const result = await this.taskModel
        .find({
          userId,
          scheduled: todayScheduledDate,
        })
        .sort({ scheduled: -1 })
        .select("-__v")
        .lean()
        .exec() as TaskDto[];

      return result || [];
    } catch (error) {
      console.error("Failed to get tasks:", error);
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

  async getInProgressTasks(userId: string): Promise<TaskDto[]> {
    try {
      const result = await this.taskModel
        .find({
          userId,
          status: "In Progress",
        })
        .sort({ scheduled: 1 })
        .select("-__v")
        .lean()
        .skip(0)
        .limit(9)
        .exec();
      return result;
    } catch (error) {
      console.error("Failed to get tasks:", error);
      throw error;
    }
  }
  async getArchivesTasks(
    userId: string,
    skip: number,
    limit: number,
    createdDateTo: string,
    createdDateFrom: string,
    startScheduleDate: string,
    endScheduleDate: string,
    priority: string,
    status: string,
    title: string,
  ): Promise<{ tasks: TaskDto[]; totalCount: number; allCount: number }> {
    const filters: any = { userId };

    if (priority) {
      filters.priority = priority;
    }

    if (title) {
      filters.title = { $regex: title, $options: "i" };
    }

    if (status) {
      filters.status = status;
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

    if (startScheduleDate || endScheduleDate) {
      filters.scheduled = {};
      if (startScheduleDate) {
        filters.scheduled.$gte = startScheduleDate;
      }
      if (endScheduleDate) {
        filters.scheduled.$lt = endScheduleDate;
      }
    }

    try {
      const [tasks, totalCount, allCount] = await Promise.all([
        this.taskModel
          .find(filters)
          .sort({ scheduled: -1, _id: 1 })
          .select("-__v")
          .lean()
          .skip(skip)
          .limit(limit)
          .exec(),
        this.taskModel.countDocuments(filters).exec(),
        this.taskModel.countDocuments({ userId }).exec(),
      ]);

      return {
        tasks,
        totalCount,
        allCount,
      };
    } catch (error) {
      console.error("Failed to get tasks:", error);
      throw error;
    }
  }

  async deleteTask(userId: string, id: string, googleRefreshToken?: string): Promise<ObjectId> {
    try {
      const result = await this.taskModel
        .findByIdAndDelete({ _id: id, userId })
        .exec();
      if (!result) {
        throw new Error("Task not found");
      }

      // Sync to Google Tasks
      if (result.googleEventId && googleRefreshToken) {
        try {
          await this.googleCalendarService.deleteGoogleTask(
            googleRefreshToken,
            result.googleEventId
          );
        } catch (calErr) {
          console.error("Failed to delete Google Task:", calErr);
        }
      }

      return result._id;
    } catch (error) {
      console.error("Failed to delete task:", error);
      throw error;
    }
  }
}
