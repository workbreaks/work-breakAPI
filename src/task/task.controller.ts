import {
  Body,
  Controller,
  Post,
  Get,
  Put,
  Query,
  Delete,
  Param,
  Request,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { TaskDto } from "./task.dto";
import { TaskService } from "./task.service";
import { ObjectId } from "mongoose";
import { JwtAuthGuard } from "../user-auth/api/auth/jwt-auth.gaurd";

@UseGuards(JwtAuthGuard)
@Controller("task")
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post("add")
  async createTask(@Body() tasks: TaskDto, @Request() req): Promise<ObjectId> {
    const loginId = req.user?.sub;
    const googleRefreshToken = req.user?.googleRefreshToken;
    if (!loginId) {
      throw new BadRequestException("Unauthorized to add task");
    }
    tasks.userId = loginId;
    const insertedId = await this.taskService.createTask(tasks, undefined, googleRefreshToken);
    return insertedId;
  }

  @Put("edit/:id")
  async editTask(
    @Param("id") id: string,
    @Body() tasks: TaskDto,
    @Request() req,
  ): Promise<ObjectId> {
    tasks.userId = req.user.sub;
    const googleRefreshToken = req.user?.googleRefreshToken;
    const insertedId = await this.taskService.createTask(tasks, id, googleRefreshToken);
    return insertedId;
  }

  @Delete("delete/:id")
  async deleteTask(@Param("id") id: string, @Request() req): Promise<ObjectId> {
    const googleRefreshToken = req.user?.googleRefreshToken;
    const insertedId = await this.taskService.deleteTask(req.user.sub, id, googleRefreshToken);
    return insertedId;
  }

  @Get("get")
  async getTasks(
    @Request() req,
    @Query("isScheduled") isScheduled: string,
    @Query("previousTwoWeeks") previousTwoWeeks: string,
    @Query("nextTwoWeeks") nextTwoWeeks: string,
  ): Promise<TaskDto[]> {
    const isScheduledBoolean = JSON.parse(isScheduled.toLowerCase());
    const tasks = await this.taskService.getTasks(
      req.user.sub,
      isScheduledBoolean,
      previousTwoWeeks,
      nextTwoWeeks
    );
    return tasks;
  }

  @Get("todayTasks")
  async todayTasks(
    @Request() req,
    @Query("todayScheduledDate") todayScheduledDate: string,
  ): Promise<TaskDto[]> {
    const tasks = await this.taskService.todayTasks(
      req.user.sub,
      todayScheduledDate
    );
    return tasks;
  }

  @Get("getInProgressTasks")
  async getInProgressTasks(
    @Query("id") id: string,
    @Request() req,
    @Query("userId") userId?: string,
  ): Promise<TaskDto[]> {
    if (id !== req.user.sub) {
      throw new BadRequestException("Unauthorized to view tasks");
    }
    const tasksId = userId || req.user.sub;
    const tasks = await this.taskService.getInProgressTasks(tasksId);
    return tasks;
  }

  @Get("getArchivesTasks")
  async getArchivesTasks(
    @Query("id") id: string,
    @Request() req,
    @Query("skip") skip: any,
    @Query("limit") limit: any,
    @Query("startScheduleDate") startScheduleDate?: string,
    @Query("endScheduleDate") endScheduleDate?: string,
    @Query("createdDateTo") createdDateTo?: string,
    @Query("createdDateFrom") createdDateFrom?: string,
    @Query("priority") priority?: string,
    @Query("status") status?: string,
    @Query("title") title?: string,
    @Query("userId") userId?: string,
  ): Promise<{ tasks: TaskDto[]; totalCount: number; allCount: number }> {
    const skips = parseInt(skip, 10) || 0;
    const limits = parseInt(limit, 10) || 1000000;
    const loginId = req.user.sub;
    if (id !== loginId) {
      throw new BadRequestException("Unauthorized to view Tasks");
    }
    const isAbleToView = await this.taskService.amITheAdmin(userId, loginId);
    // hack case, user not accpted to admin and user somehow hack and try
    if (!isAbleToView && userId) {
      throw new BadRequestException("Unauthorized to view Tasks");
    }
    let tasksId = userId;
    // same user looking his own task
    if (!isAbleToView && !userId) {
      tasksId = loginId;
    }
    // admin looking for the team members Tasks
    if (isAbleToView && userId) {
      tasksId = userId;
    }

    const { tasks, totalCount, allCount } =
      await this.taskService.getArchivesTasks(
        tasksId,
        skips,
        limits,
        startScheduleDate,
        endScheduleDate,
        createdDateTo,
        createdDateFrom,
        priority,
        status,
        title
      );
    return { tasks, totalCount, allCount };
  }
}
