import { Controller, Body, Post } from "@nestjs/common";
import { AssistantService } from "./assistant.service";

@Controller("assistant")
export class AssistantController {
  constructor(private readonly service: AssistantService) {}

  @Post("ask")
  async ask(@Body("message") message: string): Promise<any> {
    const response = await this.service.ask(message);
    return response;
  }
}
