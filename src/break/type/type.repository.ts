import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { TypeDto } from "./type.dto";
import { BreaksType } from "./breaks-type.schema";
import { Model } from "mongoose";
import { Break } from "../break.schema";

@Injectable()
export class TypeRepository {
  constructor(
    @InjectModel(BreaksType.name) private breaksTypeModel: Model<BreaksType>,
    @InjectModel(Break.name) private breakModel: Model<Break>,
  ) {}

  async update(
    userId: string,
    deletedType: string,
    types: string[],
  ): Promise<string> {
    const existingBreak = await this.breaksTypeModel.findOne({ userId }).exec();
    if (!existingBreak) {
      throw new NotFoundException(`Break with userId ${userId} not found`);
    }

    // Trim all incoming types
    const trimmedTypes = types.map((t) => t.trim());
    const duplicatesInInput = trimmedTypes.filter(
      (t, i) => trimmedTypes.indexOf(t) !== i,
    );
    if (duplicatesInInput.length > 0) {
      throw new BadRequestException("The type already exists.");
    }

    // Save updated types
    const originalTypes = [...existingBreak.type];
    existingBreak.type = trimmedTypes;
    const updatedBreak = await existingBreak.save();
    try {
      if (deletedType && deletedType.length > 0) {
        const deleteResult = await this.breakModel
          .deleteMany({ type: deletedType, userId })
          .exec();
        if (deleteResult.deletedCount === 0) {
          console.warn(
            `No breaks found with type "${deletedType}" for userId "${userId}"`,
          );
        }
      }

      return updatedBreak._id.toString();
    } catch (error) {
      console.error("Error during deletion, rolling back type update:", error);

      existingBreak.type = originalTypes;
      await existingBreak.save();
      throw error;
    }
  }

  async get(userId: string): Promise<TypeDto[]> {
    try {
      const result = await this.breaksTypeModel
        .find({ userId })
        .select("-__v")
        .lean()
        .exec();
      return result;
    } catch (error) {
      console.error("Failed to get types:", error);
      throw error;
    }
  }
}
