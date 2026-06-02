import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Response } from 'express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { UploadFileDto } from './dto/upload-file.dto';
import { FilesService } from './files.service';

@ApiTags('Files')
@ApiBearerAuth('access-token')
@Controller('files')
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Roles(UserRole.ADMIN, UserRole.SALES)
  @Post('upload')
  @ApiOperation({ summary: 'Upload attachment to an inquiry' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'inquiryId'],
      properties: {
        inquiryId: { type: 'string', format: 'uuid' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.filesService.upload(dto.inquiryId, file, user);
  }

  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.DEVELOPER)
  @Get('inquiry/:inquiryId')
  @ApiOperation({ summary: 'List attachments for an inquiry' })
  listByInquiry(
    @Param('inquiryId') inquiryId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.filesService.listByInquiry(inquiryId, user);
  }

  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.DEVELOPER)
  @Get(':id/download')
  @ApiOperation({ summary: 'Download attachment' })
  async download(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const { attachment, stream } = await this.filesService.getFileStream(
      id,
      user,
    );
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${attachment.fileName}"`,
    );
    stream.pipe(res);
  }

  @Roles(UserRole.ADMIN, UserRole.SALES)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete attachment' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.filesService.remove(id, user);
  }
}
