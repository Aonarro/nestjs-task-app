import { LoggerService } from './logger.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(private readonly loggerService: LoggerService) {}
  getHello(): string {
    return this.loggerService.log('Hello World!');
  }
}
