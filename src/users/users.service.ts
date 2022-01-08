import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { generate } from 'password-hash';
import { Role, User, UserDocument } from './models/schema/users.schema';
import { Model } from 'mongoose';
import { UserDTO } from './models/dto/users.dto';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}
  async onModuleInit() {
    await this.save({
      email: 'alessandro.drago@gmail.com',
      username: 'ROOT',
      roles: ['admin'],
    });
  }

  async findOne(username: string): Promise<User> {
    const found = await this.userModel
      .findOne({ username: UsersService.encrypt(username) })
      .exec();
    if (!found) {
      throw new NotFoundException();
    }
    const { email, username: usernamedDb, resetPassword, roles } = found;
    return {
      ...found,
      resetPassword,
      roles: roles.map((role) => UsersService.decrypt(role) as Role),
      email: UsersService.decrypt(email),
      username: UsersService.decrypt(usernamedDb),
    };
  }
  async findAll() {
    return this.userModel.find().exec();
  }
  async save(user: UserDTO) {
    const { email, username, roles } = user;
    return new this.userModel({
      ...user,
      username: UsersService.encrypt(username),
      email: UsersService.encrypt(email),
      password: UsersService.hashing('DUMMYPASSWORD'),
      created: new Date(),
      resetPassword: true,
      roles: roles.map((role) => UsersService.encrypt(role)),
    }).save();
  }

  private static initVector = randomBytes(16);
  private static securityKey = randomBytes(32);

  static encrypt = (text: string): string => {
    const cipher = createCipheriv(
      'aes-256-cbc',
      UsersService.securityKey,
      UsersService.initVector,
    );
    return `${cipher.update(text, 'utf-8', 'hex')}${cipher.final('hex')}`;
  };

  static decrypt = (text: string): string => {
    const decipher = createDecipheriv(
      'aes-256-cbc',
      UsersService.securityKey,
      UsersService.initVector,
    );
    return `${decipher.update(text, 'hex', 'utf-8')}${decipher.final('utf8')}`;
  };

  static hashing(val: string) {
    return generate(val);
  }
}
