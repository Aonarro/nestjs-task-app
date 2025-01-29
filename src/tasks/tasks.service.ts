import { Injectable } from '@nestjs/common';
import { TaskStatus } from './task.model';
import { CreateTaskDto } from './create-task.dto';
import { UpdateTaskDto } from './update-task.dto';
import { WrongTaskStatusException } from './exceptions/wrong-task-status.exception';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTaskLabelDto } from './create-task-label.dto';
import { TaskLabel } from './entities/task-label.entity';
import { FindTaskParams } from './find-task.params';
import { PaginationParams } from '../common/pagination.params';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private readonly tasksRepository: Repository<Task>,
    @InjectRepository(TaskLabel)
    private readonly tasksLabelRepository: Repository<TaskLabel>,
  ) {}

  async findAll(
    filters: FindTaskParams,
    pagination: PaginationParams,
    userId: string,
  ): Promise<[Task[], number]> {
    // const where: FindOptionsWhere<Task>[] = [];
    // if (filters.status) {
    //   where.push({ status: filters.status });
    // }

    // if (filters.search?.trim()) {
    //   console.log(filters.search);
    //   where.push(
    //     { title: Like(`%${filters.search}%`) },
    //     { description: Like(`%${filters.search}%`) }, // Добавляем оба условия
    //   );
    // }

    const query = this.tasksRepository.createQueryBuilder('task');

    query
      .leftJoinAndSelect('task.labels', 'labels')
      .where('task.userId = :userId', { userId: userId });

    if (filters.status) {
      query.andWhere('task.status = :status', { status: filters.status });
    }

    if (filters.search?.trim()) {
      query.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        {
          search: `%${filters.search}%`,
        },
      );
    }

    if (filters.labels?.length) {
      const subQuery = query
        .subQuery()
        .select('labels.taskId')
        .from('labels', 'labels')
        .where('labels.name IN (:...labelNames)', {
          labelNames: filters.labels,
        })
        .getQuery();
      query.andWhere(`task.id IN ${subQuery}`);
      // query.andWhere('labels.name IN (:...labelNames)', {
      //   labelNames: filters.labels,
      // });
    }

    query.orderBy(`task.${filters.sortBy}`, filters.sortOrder);

    query.skip(pagination.offset).take(pagination.limit);

    // console.log(query.getSql());

    return await query.getManyAndCount();

    // return await this.tasksRepository.findAndCount({
    //   where,
    //   relations: ['labels'],
    //   skip: pagination.offset,
    //   take: pagination.limit,
    // });
  }

  async findOne(id: string): Promise<Task | null> {
    return await this.tasksRepository.findOne({
      where: { id },
      relations: ['labels'],
    });
  }

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    if (createTaskDto.labels) {
      createTaskDto.labels = this.getUniqueLabels(createTaskDto.labels);
    }
    const createdTask = await this.tasksRepository.save({
      ...createTaskDto,
    });
    return createdTask;
  }

  async delete(task: Task): Promise<void> {
    await this.tasksRepository.delete(task.id);
  }

  async updateTask(task: Task, updateTaskDto: UpdateTaskDto): Promise<Task> {
    if (
      updateTaskDto.status &&
      !this.isValidStatusTransition(task.status, updateTaskDto.status)
    ) {
      throw new WrongTaskStatusException();
    }
    if (updateTaskDto.labels) {
      updateTaskDto.labels = this.getUniqueLabels(updateTaskDto.labels);
    }
    Object.assign(task, updateTaskDto);

    return await this.tasksRepository.save(task);
  }

  async addLabels(task: Task, labelDtos: CreateTaskLabelDto[]): Promise<Task> {
    const names = new Set(task.labels.map((label) => label.name));

    const labels = this.getUniqueLabels(labelDtos)
      .filter((dto) => !names.has(dto.name))
      .map((label) => this.tasksLabelRepository.create(label));

    if (labels.length) {
      task.labels = [...task.labels, ...labels];
      return await this.tasksRepository.save(task);
    } else {
      return task;
    }
  }
  async removeLabels(task: Task, labels: string[]): Promise<void> {
    // const query = this.tasksRepository.createQueryBuilder();
    task.labels = task.labels.filter((label) => !labels.includes(label.name));
    await this.tasksRepository.save(task);
  }

  private isValidStatusTransition(
    currentStatus: TaskStatus,
    newStatus: TaskStatus,
  ): boolean {
    const statusOrder = [
      TaskStatus.OPEN,
      TaskStatus.IN_PROGRESS,
      TaskStatus.DONE,
    ];

    return statusOrder.indexOf(currentStatus) <= statusOrder.indexOf(newStatus);
  }

  private getUniqueLabels(
    labelDtos: CreateTaskLabelDto[],
  ): CreateTaskLabelDto[] {
    const uniqueNames = [...new Set(labelDtos.map((label) => label.name))];

    return uniqueNames.map((name) => ({
      name,
    }));
  }
}
