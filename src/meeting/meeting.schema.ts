import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class Meeting extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  from: string;

  @Prop({ required: true })
  to: string;

  @Prop({ required: true })
  scheduleDate: string;

  @Prop({ required: false })
  description: string;

  @Prop({ required: false })
  googleEventId: string;
}

export const MeetingSchema = SchemaFactory.createForClass(Meeting);
