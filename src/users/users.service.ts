import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createCipheriv, createDecipheriv } from 'crypto';
import { generate } from 'password-hash';
import { isNull, isUndefined } from 'lodash';
import { IV_KEY, jwtConstants } from '../configurations/properties';
import { User, UserDocument } from './models/schema/users.schema';
import { Model } from 'mongoose';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}
  onModuleInit() {
    new this.userModel({
      email: 'alessandro.drago@gmail.com',
      password: UsersService.hashing('dummy'),
      resetPassword: true,
      username: 'ROOT',
      created: new Date(),
      roles: ['admin'],
    }).save();
  }

  async findOne(username: string) {
    return this.userModel.findOne({ username: username }).exec();
  }
  save(user: User) {
    return new this.userModel({
      ...user,
      password: UsersService.hashing(user.password),
      created: new Date(),
    }).save();
  }

  static encrypt(text: string) {
    const secretInBytes = Buffer.from(jwtConstants.secret, 'base64');
    const cipher = createCipheriv('aes-256-gcm', secretInBytes, IV_KEY);
    let crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
  }

  static decrypt(text: string) {
    if (isNull(text) || isUndefined(text)) {
      return text;
    }
    const secretInBytes = Buffer.from(jwtConstants.secret, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', secretInBytes, IV_KEY);
    let dec = decipher.update(text, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  }

  static hashing(val: string) {
    return generate(val);
  }
}
