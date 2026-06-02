import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UploadFileDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  inquiryId!: string;
}
