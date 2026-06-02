import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProposalPdfService {
  constructor(private prisma: PrismaService) {}

  async generatePdf(proposalId: string): Promise<{
    stream: PassThrough;
    fileName: string;
  }> {
    const proposal = await this.prisma.proposal.findFirst({
      where: { id: proposalId, deletedAt: null },
      include: {
        inquiry: { select: { projectTitle: true } },
        lead: { select: { companyName: true } },
      },
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    const doc = new PDFDocument({ margin: 50 });
    const stream = new PassThrough();
    doc.pipe(stream);

    const title = `${proposal.lead.companyName} — Proposal Brief`;
    doc.fontSize(20).text(title, { align: 'center' });
    doc.moveDown();
    doc
      .fontSize(11)
      .fillColor('#555555')
      .text(proposal.inquiry.projectTitle, { align: 'center' });
    doc.moveDown(2);
    doc.fillColor('#000000');

    const sections: Array<[string, string]> = [
      ['Project Summary', proposal.projectSummary],
      ['Suggested Features', proposal.suggestedFeatures],
      ['Technical Approach', proposal.technicalApproach],
      ['Estimated Complexity', proposal.estimatedComplexity],
      ['Suggested Timeline', proposal.suggestedTimeline],
      ['Questions to Ask the Client', proposal.questionsToAsk],
    ];

    for (const [heading, body] of sections) {
      doc.fontSize(14).font('Helvetica-Bold').text(heading);
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica').text(body, { align: 'left' });
      doc.moveDown(1.5);
    }

    doc
      .fontSize(9)
      .fillColor('#888888')
      .text(
        `Generated ${proposal.generatedByAI ? 'with AI assistance' : 'manually'} · ${new Date(proposal.updatedAt).toLocaleString()}`,
        { align: 'center' },
      );

    doc.end();

    const safeName = proposal.lead.companyName
      .replace(/[^a-z0-9]+/gi, '-')
      .toLowerCase();

    return {
      stream,
      fileName: `${safeName}-proposal.pdf`,
    };
  }
}
