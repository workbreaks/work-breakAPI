import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class TaskDto {
  @IsString()
  @IsOptional()
  userId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsNotEmpty()
  priority: string;

  @IsNotEmpty()
  scheduled: string; // Ensure this is either a valid date string or Date object

  @IsString()
  @IsNotEmpty()
  createdDate?: string;

  @IsOptional()
  updatedDate?: Date | string;

  @IsString()
  @IsOptional()
  googleEventId?: string;
}
