import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class GenerateProposalDto {
  @ApiProperty()
  @IsUUID()
  inquiryId!: string;
}
