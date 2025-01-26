import { CreateTaskDto } from './create-task.dto';
import { ITask } from './task.model';
import { TasksService } from './tasks.service';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  public getAllTasks(): ITask[] {
    return this.tasksService.findAll();
  }

  @Get('/:id')
  public getTaskById(@Param('id') id: string): ITask {
    return this.tasksService.findOne(id);
  }

  @Post()
  public createTask(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }
}
