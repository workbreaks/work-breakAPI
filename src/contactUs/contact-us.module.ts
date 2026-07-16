import { Module } from "@nestjs/common";
import { ContactUsController } from "./contact-us.controller";
import { ContactUsService } from "./contact-us.service";
import { ContactUsRepository } from "./contact-us.repository";
import { MongooseModule } from "@nestjs/mongoose";
import { ContactUs, ContactUsSchema } from "./contact-us.schema";
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ContactUs.name, schema: ContactUsSchema },
    ]),
  ],
  controllers: [ContactUsController],
  providers: [ContactUsService, ContactUsRepository],
})
export class ContactUsModule {}
