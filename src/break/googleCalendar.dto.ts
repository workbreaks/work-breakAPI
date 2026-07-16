import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional
} from "class-validator";

export class GCDto {

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsNumber()
  @IsNotEmpty()
  duration: number;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;
}
