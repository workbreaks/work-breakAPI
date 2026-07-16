import { Injectable } from "@nestjs/common";
import { TaskDto } from "./task.dto";
import { TaskRepository } from "./task.repository";
import { ObjectId } from "mongoose";

@Injectable()
export class TaskService {
  constructor(private readonly taskRepository: TaskRepository) {}

  async createTask(
    taskDto: TaskDto,
    mongoId: string | undefined,
    googleRefreshToken?: string,
  ): Promise<ObjectId> {
    const id = await this.taskRepository.createTask(taskDto, mongoId, googleRefreshToken);
    return id;
  }

  async deleteTask(userId: string, mongoId: string, googleRefreshToken?: string): Promise<ObjectId> {
    const id = await this.taskRepository.deleteTask(userId, mongoId, googleRefreshToken);
    return id;
  }

  async getTasks(
    userId: string,
    isScheduledBoolean: boolean,
    previousTwoWeeks: string,
    nextTwoWeeks: string
  ): Promise<TaskDto[]> {
    const tasks = await this.taskRepository.getTasks(
      userId,
      isScheduledBoolean,
      previousTwoWeeks,
      nextTwoWeeks
    );
    return tasks;
  }

  async todayTasks(
    userId: string,
    todayScheduledDate: string
  ): Promise<TaskDto[]> {
    const tasks = await this.taskRepository.todayTasks(
      userId,
      todayScheduledDate
    );
    return tasks;
  }

  async amITheAdmin(userId: string, adminId: string): Promise<boolean> {
    const response = await this.taskRepository.amITheAdmin(userId, adminId);
    return response;
  }

  async getInProgressTasks(userId: string): Promise<TaskDto[]> {
    const tasks = await this.taskRepository.getInProgressTasks(userId);
    return tasks;
  }

  async getArchivesTasks(
    userId: string,
    skips: number,
    limits: number,
    startScheduleDate: string,
    endScheduleDate: string,
    createdDateTo: string,
    createdDateFrom: string,
    priority: string,
    status: string,
    title: string
  ): Promise<{ tasks: TaskDto[]; totalCount: number; allCount: number }> {
    const { tasks, totalCount, allCount } =
      await this.taskRepository.getArchivesTasks(
        userId,
        skips,
        limits,
        createdDateTo,
        createdDateFrom,
        startScheduleDate,
        endScheduleDate,
        priority,
        status,
        title
      );
    return { tasks, totalCount, allCount };
  }
}
