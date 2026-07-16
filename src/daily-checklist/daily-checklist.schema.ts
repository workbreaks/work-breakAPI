import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class CheckList extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop()
  task: string;

  @Prop({ required: false })
  status: boolean;

  @Prop({ required: false })
  isFeature: boolean;

  @Prop()
  createdDate: string;
}

export const CheckListSchema = SchemaFactory.createForClass(CheckList);
