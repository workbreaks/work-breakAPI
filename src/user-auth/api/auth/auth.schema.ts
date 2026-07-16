import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class User {
  @Prop()
  name: string;

  @Prop()
  provider: string;

  @Prop()
  providerId: string;

  @Prop()
  googleRefreshToken: string;

  @Prop()
  syncedEmail: string;

  @Prop()
  isActive: boolean;
}

export type UserDocument = User & Document;

export const UserSchema = SchemaFactory.createForClass(User);
