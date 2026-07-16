import { IsString, IsNotEmpty, IsOptional, IsDate } from "class-validator";

export class MeetingDto {
  @IsString()
  @IsOptional()
  userId: string;

  @IsString()
  @IsNotEmpty()
  from: string;

  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  scheduleDate: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  timezone?: string;
}
