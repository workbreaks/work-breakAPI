import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class CheckListDto {
  @IsString()
  @IsOptional()
  userId: string;

  @IsString()
  @IsNotEmpty()
  task: string;

  @IsOptional()
  status?: boolean;

  @IsOptional()
  isFeature?: boolean;

  @IsOptional()
  @IsString()
  createdDate?: string;
}
