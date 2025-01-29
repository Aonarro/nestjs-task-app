import { AdminResponse } from './../../common/admin.response';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  NotFoundException,
  Post,
  Request,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../create-user.dto';
import { LoginUserDto } from '../login-user.dto';
import { LoginResponse } from '../../common/login.response';
import { UserService } from '../user/user.service';
import { AuthRequest } from '../auth.request';
import { Public } from '../decorators/public.decorator';
import { Role } from '../role.enum';
import { Roles } from '../decorators/roles.decorator';

@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ strategy: 'exposeAll' })
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  @Public()
  async register(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @Public()
  async login(@Body() loginUserDto: LoginUserDto): Promise<LoginResponse> {
    const access_token = await this.authService.login(loginUserDto);
    return new LoginResponse({ access_token });
  }

  @Get('profile')
  async profile(@Request() req: AuthRequest): Promise<User> {
    const userId = req.user.sub;
    const user = await this.userService.findOne(userId);

    if (user) {
      return user;
    }

    throw new NotFoundException();
  }

  @Get('admin')
  @Roles(Role.ADMIN)
  async adminOnly(): Promise<AdminResponse> {
    return new AdminResponse({ message: 'This is for admins only!!' });
  }
}
