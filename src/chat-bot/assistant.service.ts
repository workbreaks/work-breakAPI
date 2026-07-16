import { Injectable } from "@nestjs/common";
import { AssistantRepository } from "./assistant.repository";
import { ObjectId } from "mongoose";

@Injectable()
export class AssistantService {
  constructor(private readonly repository: AssistantRepository) {}

  async ask(message: string): Promise<any> {
    const id = await this.repository.ask(message);
    return id;
  }
}
