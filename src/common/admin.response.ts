import { Expose } from 'class-transformer';

export class AdminResponse {
  @Expose()
  message: string;

  constructor(partial: Partial<AdminResponse>) {
    Object.assign(this, partial);
  }
}
