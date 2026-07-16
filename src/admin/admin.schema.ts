import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class Admin extends Document {
  @Prop({ type: String })
  adminId: string;

  @Prop()
  name: string;

  @Prop()
  email: string;

  @Prop()
  userEmail: string;

  @Prop()
  createdDate: Date;

  @Prop()
  userId: string;

  @Prop()
  isAccepted: boolean;

  @Prop()
  status: string;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
