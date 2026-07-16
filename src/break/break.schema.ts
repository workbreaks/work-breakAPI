import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
@Schema()
export class Break extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  type: string;

  @Prop()
  reason: string;

  @Prop({ required: true })
  duration: number;

  @Prop({ required: false })
  startTime?: string;

  @Prop({ required: true })
  endTime: string;

  @Prop()
  createdDate: string;

  @Prop()
  isClosed: boolean;

  @Prop()
  isTimeTracker: boolean;

  @Prop()
  updatedDate: Date;

  @Prop({ required: false })
  googleEventId?: string;
}

export const BreakSchema = SchemaFactory.createForClass(Break);
