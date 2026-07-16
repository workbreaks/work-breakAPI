import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class Leaves extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop()
  reason: string;

  @Prop({ required: true })
  days: number;

  @Prop({ required: true })
  fromDate: string;

  @Prop()
  toDate: string;
}

export const LeavesSchema = SchemaFactory.createForClass(Leaves);