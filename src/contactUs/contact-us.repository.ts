import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ContactUs } from "./contact-us.schema";
import { ContactUsDto } from "./contact-us.dto";

@Injectable()
export class ContactUsRepository {
  constructor(
    @InjectModel(ContactUs.name)
    private readonly contactUsModel: Model<ContactUs>,
  ) {}

  async sendContactUS(dto: ContactUsDto): Promise<string> {
    try {
      dto.createdDate = new Date();
      console.log("ContactUs DTO:", dto);
      const cont = new this.contactUsModel(dto);
      const result = await cont.save();
      if (result?._id) {
        return "message sent!";
      }
    } catch (error) {
      console.error("Failed to create or update contact us:", error);
      throw error;
    }
  }
}
