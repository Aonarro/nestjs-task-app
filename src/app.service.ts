import { LoggerService } from './logger.service';
import { Injectable } from '@nestjs/common';
import { AppConfig } from './config/app.config';
import { TypedConfigService } from './config/typed-config.service';

@Injectable()
export class AppService {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly configService: TypedConfigService,
  ) {}
  getHello(): string {
    const prefix = this.configService.get<AppConfig>('app')?.messagePrefix;
    return this.loggerService.log(`${prefix} Hello World!`);
  }
}
