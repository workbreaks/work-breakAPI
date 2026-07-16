import { IsString, IsNotEmpty, IsOptional, IsNumber } from "class-validator";

export class LeavesDto {
  @IsString()
  @IsOptional()
  userId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsNumber()
  @IsNotEmpty()
  days: number;

  @IsNotEmpty()
  fromDate: string;

  @IsOptional()
  toDate?: string;
}