import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AttachmentsService } from './attachments.service';
import { PresignDto } from './dto/presign.dto';

@Controller('attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('presign')
  presign(@Body() dto: PresignDto) {
    return this.attachmentsService.createPresignedUpload(dto.fileName, dto.mimeType);
  }
}
