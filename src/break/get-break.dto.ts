import { IsOptional, IsString } from "class-validator";

export class GetBreaksDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  isToday?: string;

  @IsOptional()
  @IsString()
  isMonth?: string;

  @IsOptional()
  onCreatedDate?: string;

  @IsOptional()
  fourWeekDateRange?: string;
}
