import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
@Schema({ timestamps: true })
export class BreaksType extends Document {
  // Extend Document for Mongoose Document type
  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: [String], required: true }) // Array of strings
  type: string[];
}
export const BreaksTypeSchema = SchemaFactory.createForClass(BreaksType);
