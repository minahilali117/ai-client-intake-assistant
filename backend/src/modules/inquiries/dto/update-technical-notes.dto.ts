import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UpdateTechnicalNotesDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  technicalNotes!: string;
}
