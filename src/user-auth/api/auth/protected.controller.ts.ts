import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "./jwt-auth.gaurd"; // Adjust the path if necessary

@Controller("protected")
export class ProtectedController {
  @Get()
  @UseGuards(JwtAuthGuard)
  getProtectedResource() {
    return { message: "This is a protected resource" };
  }
}
