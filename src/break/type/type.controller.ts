import {
  Controller,
  Put,
  Query,
  Get,
  Body,
  Param,
  Request,
  UseGuards,
} from "@nestjs/common";
import { TypeService } from "./type.service";
import { TypeDto } from "./type.dto";
import { JwtAuthGuard } from "../../user-auth/api/auth/jwt-auth.gaurd";

@UseGuards(JwtAuthGuard)
@Controller("type")
export class TypeController {
  constructor(private readonly service: TypeService) {}

  @Put("/")
  async updateBreaks(
    @Body("deletedType") deletedType: string,
    @Body("type") types: string[],
    @Request() req,
  ) {
    return this.service.editTypes(req.user.sub, deletedType, types);
  }

  @Get("get")
  async get(@Request() req): Promise<TypeDto[]> {
    return await this.service.get(req.user.sub);
  }
}
