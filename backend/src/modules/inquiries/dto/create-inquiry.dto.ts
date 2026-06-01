import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Priority, ProjectType } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateInquiryDto {
  @ApiProperty()
  @IsUUID()
  leadId!: string;

  @ApiProperty({ example: 'Customer Portal Redesign' })
  @IsString()
  @MinLength(1)
  projectTitle!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  description!: string;

  @ApiProperty({ enum: ProjectType })
  @IsEnum(ProjectType)
  projectType!: ProjectType;

  @ApiProperty({ example: '$50k–$100k' })
  @IsString()
  @MinLength(1)
  budgetRange!: string;

  @ApiProperty({ example: '3–6 months' })
  @IsString()
  @MinLength(1)
  expectedTimeline!: string;

  @ApiPropertyOptional({ enum: Priority, default: Priority.MEDIUM })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  technicalNotes?: string;
}
