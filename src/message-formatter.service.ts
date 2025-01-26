export class MessageFormatterService {
  constructor() {}

  format(message: string): string {
    return `${new Date().toISOString()} - ${message}`;
  }
}
