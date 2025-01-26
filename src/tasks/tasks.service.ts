import { Injectable, NotFoundException } from '@nestjs/common';
import { ITask } from './task.model';
import { CreateTaskDto } from './create-task.dto';
import { randomUUID } from 'node:crypto';

@Injectable()
export class TasksService {
  private tasks: ITask[] = [];

  findAll(): ITask[] {
    return this.tasks;
  }

  findOne(id: string): ITask {
    const task = this.tasks.find((task) => task.id === id);
    if (!task) throw new NotFoundException();
    return task;
  }

  create(createTaskDto: CreateTaskDto): ITask {
    const task = {
      id: randomUUID(),
      ...createTaskDto,
    };
    this.tasks.push(task);
    return task;
  }
}
