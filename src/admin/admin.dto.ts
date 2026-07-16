import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
} from "class-validator";

export class AdminDto {
  @IsString()
  @IsOptional()
  adminId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  userEmail?: string;

  @IsOptional()
  @IsBoolean()
  isAccepted?: boolean;

  @IsOptional()
  createdDate?: Date | string;

  @IsOptional()
  userId?: string;

  @IsOptional()
  status?: string;
}
