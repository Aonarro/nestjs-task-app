export interface AuthRequest {
  user: {
    sub: string;
    name: string;
    roles: string[];
  };
}
