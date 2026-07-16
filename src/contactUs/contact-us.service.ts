import { Injectable } from "@nestjs/common";
import { ContactUsDto } from "./contact-us.dto";
import { ContactUsRepository } from "./contact-us.repository";

@Injectable()
export class ContactUsService {
  constructor(private readonly repository: ContactUsRepository) {}

  async sendContactUS(dto: ContactUsDto): Promise<string> {
    const response = await this.repository.sendContactUS(dto);
    return response;
  }
}
