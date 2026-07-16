// users.service.ts
import { Injectable } from "@nestjs/common";

interface User {
  id: string;
  username: string;
  provider: string;
}

@Injectable()
export class UsersService {
  private readonly users: User[] = [];

  findOrCreate(user: User): User {
    const existingUser = this.users.find(
      (u) => u.id === user.id && u.provider === user.provider,
    );
    if (existingUser) {
      return existingUser;
    } else {
      this.users.push(user);
      return user;
    }
  }
}
