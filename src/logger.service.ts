import { Injectable } from '@nestjs/common';
import { MessageFormatterService } from './message-formatter.service';

@Injectable()
export class LoggerService {
  constructor(private readonly messageFormatter: MessageFormatterService) {}

  log(message: string): string {
    const formattedMessage = this.messageFormatter.format(message);
    console.log(formattedMessage);
    return formattedMessage;
  }
}
