import { Body, Controller, Post } from "@nestjs/common";
import { ContactUsDto } from "./contact-us.dto";
import { ContactUsService } from "./contact-us.service";

@Controller("contactUs")
export class ContactUsController {
  constructor(private readonly service: ContactUsService) {}

  @Post("send")
  async sendContactUs(@Body() con: ContactUsDto): Promise<string> {
    const response = await this.service.sendContactUS(con);
    return response;
  }
}
