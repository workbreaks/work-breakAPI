import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class ContactUs extends Document {
  @Prop({ required: true })
  subject: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  email: string;

  @Prop({ default: null })
  createdDate: Date | null;

  @Prop({ default: null })
  userId: string | null;
}

export const ContactUsSchema = SchemaFactory.createForClass(ContactUs);
