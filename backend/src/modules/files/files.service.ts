import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityAction, LeadStatus, UserRole } from '@prisma/client';
import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from './files.constants';

@Injectable()
export class FilesService {
  private readonly uploadDir = join(process.cwd(), 'uploads');

  constructor(
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService,
  ) {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(
    inquiryId: string,
    file: Express.Multer.File,
    user: AuthenticatedUser,
  ) {
    this.assertCanUpload(user);
    await this.getInquiryForUpload(inquiryId, user);

    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File exceeds maximum size of 5MB');
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('File type not allowed');
    }

    const storedName = `${randomUUID()}-${file.originalname}`;
    const filePath = join(this.uploadDir, storedName);
    writeFileSync(filePath, file.buffer);

    const attachment = await this.prisma.attachment.create({
      data: {
        inquiryId,
        fileName: file.originalname,
        filePath: storedName,
        mimeType: file.mimetype,
        fileSize: file.size,
        uploadedById: user.id,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await this.activityLogs.log(
      user.id,
      ActivityAction.FILE_UPLOADED,
      'inquiry',
      inquiryId,
      {
        entity: 'attachment',
        entityId: attachment.id,
        newValue: {
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          fileSize: attachment.fileSize,
        },
      },
    );

    return attachment;
  }

  async listByInquiry(inquiryId: string, user: AuthenticatedUser) {
  await this.getInquiryForView(inquiryId, user);
    return this.prisma.attachment.findMany({
      where: { inquiryId },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async getFileStream(id: string, user: AuthenticatedUser) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
      include: { inquiry: { include: { lead: true } } },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    this.assertCanViewInquiry(attachment.inquiry.lead.status, user);

    const absolutePath = join(this.uploadDir, attachment.filePath);
    if (!existsSync(absolutePath)) {
      throw new NotFoundException('File not found on disk');
    }

    return {
      attachment,
      stream: createReadStream(absolutePath),
    };
  }

  async remove(id: string, user: AuthenticatedUser) {
    this.assertCanUpload(user);
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    await this.prisma.attachment.delete({ where: { id } });
    return { message: 'Attachment deleted' };
  }

  private async getInquiryForUpload(inquiryId: string, user: AuthenticatedUser) {
    const inquiry = await this.prisma.inquiry.findFirst({
      where: { id: inquiryId, deletedAt: null },
      include: { lead: true },
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    this.assertCanViewInquiry(inquiry.lead.status, user);

    if (user.role === UserRole.DEVELOPER) {
      throw new ForbiddenException('Developers cannot upload files');
    }

    return inquiry;
  }

  private async getInquiryForView(inquiryId: string, user: AuthenticatedUser) {
  const inquiry = await this.prisma.inquiry.findFirst({
    where: { id: inquiryId, deletedAt: null },
    include: { lead: true },
  });

  if (!inquiry) {
    throw new NotFoundException('Inquiry not found');
  }

  this.assertCanViewInquiry(inquiry.lead.status, user);

  return inquiry;
}

  private assertCanUpload(user: AuthenticatedUser) {
    if (user.role === UserRole.DEVELOPER) {
      throw new ForbiddenException('Developers cannot upload files');
    }
  }

  private assertCanViewInquiry(status: LeadStatus, user: AuthenticatedUser) {
    if (
      user.role === UserRole.DEVELOPER &&
      status !== LeadStatus.QUALIFIED &&
      status !== LeadStatus.PROPOSAL_SENT &&
      status !== LeadStatus.WON
    ) {
      throw new ForbiddenException('Access denied to this inquiry');
    }
  }
}
