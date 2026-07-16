import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { TypeRepository } from "./type.repository";
import { TypeDto } from "./type.dto";
import { BreaksType } from "./breaks-type.schema";
@Injectable()
export class TypeService {
  private readonly logger = new Logger(TypeService.name);
  // constructor(private readonly typeRepository: TypeRepository) {}
  constructor(
    private readonly typeRepository: TypeRepository,
    @InjectModel(BreaksType.name)
    private readonly breaksTypeModel: Model<BreaksType>,
  ) {}

  async editTypes(userId: string, deletedType: string, type: string[]) {
    return await this.typeRepository.update(userId, deletedType, type);
  }

  async get(userId: string): Promise<TypeDto[]> {
    return await this.typeRepository.get(userId);
  }

  async isBreakTypeExistsForUser(userId: string): Promise<boolean> {
    return !!(await this.breaksTypeModel.exists({ userId }));
  }

  async createBreaksType(
    userId: string,
  ): Promise<{ message: string; breaksType?: BreaksType }> {
    try {
      const existing = await this.breaksTypeModel.findOne({ userId });

      if (existing) {
        return {
          message: "Breaks type already exists for this user",
          breaksType: existing,
        };
      }
      const types: string[] = [
        "Short Break",
        "Coffee Break",
        "Refreshment",
        "Social Media Break",
        "Smoking Break",
        "Lunch Break",
        "Picking kids from School",
      ];
      const newBreaksType = new this.breaksTypeModel({ userId, type: types });
      const savedBreaksType = await newBreaksType.save();
      return {
        message: "Breaks type created successfully",
        breaksType: savedBreaksType,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create breaks type: ${error.message}`,
        error.stack,
      );
      return { message: `Failed to create breaks type: ${error.message}` };
    }
  }
}
