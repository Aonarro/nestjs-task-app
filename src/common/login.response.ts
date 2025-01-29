import { Expose } from 'class-transformer';

export class LoginResponse {
  @Expose()
  access_token: string;

  constructor(partial: Partial<LoginResponse>) {
    Object.assign(this, partial);
  }
}
