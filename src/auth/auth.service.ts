import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Signup } from '../models/signup.model.';
import { IBaseUser } from '../models/users.model';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    username: string,
    userPassword: string,
  ): Promise<IBaseUser> {
    const user = await this.userService.findOne(username);
    if (!user) {
      return null;
    }
    const { password, ...rest } = user;
    if (password === userPassword) {
      return { ...rest };
    }
  }

  async login(user: IBaseUser) {
    const { username, userId, email } = user;
    return {
      access_token: this.jwtService.sign({ username, sub: userId, email }),
    };
  }
  async signup(user: Signup) {
    const { username, password, email, confirmationPassword } = user;

    // save to db
  }
}
