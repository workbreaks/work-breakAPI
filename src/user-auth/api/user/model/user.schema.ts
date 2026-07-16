import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class User {
  @Prop()
  @Prop()
  id: string;

  @Prop()
  username: string;

  @Prop()
  provider: string;

  @Prop()
  providerId: string; // Add providerId for Google, GitHub

  @Prop()
  name?: string; // Optional, in case social login doesn't provide a name

  @Prop() googleRefreshToken?: string;
  @Prop() syncedEmail?: string;
  @Prop({ lowercase: true, sparse: true }) // sparse: true allows for unique but null values
  email?: string; // Optional, as some providers might not provide an email

  @Prop({ select: false })
  password?: string; // Optional, social login users might not have a password

  @Prop()
  isActive?: boolean;

  @Prop()
  isDeleted?: boolean;
}

export type UserDocument = User & Document;

export const UserSchema = SchemaFactory.createForClass(User);
