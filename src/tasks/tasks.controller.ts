import { CreateTaskDto } from './create-task.dto';
import { FindOneParams } from './find-one.params';
import { TasksService } from './tasks.service';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { UpdateTaskDto } from './update-task.dto';
import { WrongTaskStatusException } from './exceptions/wrong-task-status.exception';
import { Task } from './entities/task.entity';
import { CreateTaskLabelDto } from './create-task-label.dto';
import { FindTaskParams } from './find-task.params';
import { PaginationParams } from '../common/pagination.params';
import { PaginationResponse } from '../common/pagination.response';
import { CurrentUserId } from '../users/decorators/current-userId.decorator';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  public async getAllTasks(
    @Query() filters: FindTaskParams,
    @Query() pagination: PaginationParams,
    @CurrentUserId() userId: string,
  ): Promise<PaginationResponse<Task>> {
    const [items, total] = await this.tasksService.findAll(
      filters,
      pagination,
      userId,
    );

    return {
      data: items,
      meta: {
        ...pagination,
        total: total,
      },
    };
  }

  @Get('/:id')
  public async getTaskById(
    @Param() params: FindOneParams,
    @CurrentUserId() userId: string,
  ): Promise<Task> {
    const task = await this.findOneOrFail(params.id);
    this.checkTaskOwnerShip(task, userId);
    return task;
  }

  @Post()
  public async createTask(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUserId() userId: string,
  ): Promise<Task> {
    return await this.tasksService.create({ ...createTaskDto, userId: userId });
  }

  @Put('/:id')
  public async updateTask(
    @Param() params: FindOneParams,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUserId() userId: string,
  ): Promise<Task> {
    const task = await this.findOneOrFail(params.id);
    this.checkTaskOwnerShip(task, userId);
    try {
      return await this.tasksService.updateTask(task, updateTaskDto);
    } catch (error) {
      if (error instanceof WrongTaskStatusException) {
        throw new BadRequestException([error.message]);
      }

      throw error;
    }
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deleteTask(
    @Param() params: FindOneParams,
    @CurrentUserId() userId: string,
  ): Promise<void> {
    const task = await this.findOneOrFail(params.id);
    this.checkTaskOwnerShip(task, userId);
    await this.tasksService.delete(task);
  }

  @Post('/:id/labels')
  public async addLabels(
    @Param() params: FindOneParams,
    @Body() labels: CreateTaskLabelDto[],
    @CurrentUserId() userId: string,
  ): Promise<Task> {
    const task = await this.findOneOrFail(params.id);
    this.checkTaskOwnerShip(task, userId);
    return this.tasksService.addLabels(task, labels);
  }

  @Delete('/:id/labels')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async removeLabels(
    @Param() params: FindOneParams,
    @Body() labels: string[],
    @CurrentUserId() userId: string,
  ): Promise<void> {
    const task = await this.findOneOrFail(params.id);
    this.checkTaskOwnerShip(task, userId);
    return this.tasksService.removeLabels(task, labels);
  }

  private checkTaskOwnerShip(task: Task, userId: string): void {
    if (task.userId !== userId) {
      throw new ForbiddenException('You can only access your own tasks');
    }
  }

  private async findOneOrFail(id: string): Promise<Task> {
    const task = await this.tasksService.findOne(id);

    if (!task) throw new NotFoundException();

    return task;
  }
}
