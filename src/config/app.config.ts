import { registerAs } from '@nestjs/config';

export interface AppConfig {
  messagePrefix: string;
}

export const appConfig = registerAs('app', (): AppConfig => {
  return {
    messagePrefix: process.env.APP_MESSAGE_PREFIX ?? 'Hello ',
  };
});
