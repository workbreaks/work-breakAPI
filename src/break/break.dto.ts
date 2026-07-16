import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsOptional,
  IsBoolean,
} from "class-validator";

export class BreakDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  reason: string;

  @IsNumber()
  @IsNotEmpty()
  duration: number;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsBoolean()
  isClosed: boolean;

  @IsBoolean()
  isTimeTracker: boolean;

  @IsString()
  @IsOptional()
  createdDate?: string;

  @IsDateString()
  @IsOptional()
  updatedDate?: Date | string;

  @IsString()
  @IsOptional()
  googleEventId?: string;

  @IsString()
  @IsOptional()
  timezone?: string;
}
