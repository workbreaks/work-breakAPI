import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class Task extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  priority: string;

  @Prop({ required: true })
  scheduled: string;

  @Prop()
  createdDate: string;

  @Prop()
  updatedDate: Date;

  @Prop({ required: false })
  googleEventId: string;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
