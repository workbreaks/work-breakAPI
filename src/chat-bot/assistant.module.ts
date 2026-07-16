import { Module } from "@nestjs/common";
import { AssistantController } from "./assistant.controller";
import { AssistantService } from "./assistant.service";
import { AssistantRepository } from "./assistant.repository";
@Module({
  imports: [],
  controllers: [AssistantController],
  providers: [AssistantService, AssistantRepository],
})
export class AssistantModule {}
