import { PasswordService } from './../password/password.service';
import { CreateUserDto } from './../create-user.dto';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';
import { LoginUserDto } from '../login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
  ) {}

  public async register(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userService.findOneByEmail(
      createUserDto.email,
    );

    if (existingUser) {
      throw new ConflictException('This user already exists');
    }

    const user = await this.userService.createUser(createUserDto);

    return user;
  }

  private generateToken(user: User): string {
    const payload = { sub: user.id, name: user.name, roles: user.roles };
    return this.jwtService.sign(payload);
  }

  public async login(loginUserDto: LoginUserDto): Promise<string> {
    const existingUser = await this.userService.findOneByEmail(
      loginUserDto.email,
    );

    if (!existingUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = this.passwordService.verify(
      loginUserDto.password,
      existingUser.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(existingUser);
  }
}
