import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AttachmentsService } from './attachments.service';
import { PresignDto } from './dto/presign.dto';
import { SignGetDto } from './dto/sign-get.dto';

@Controller('attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
  constructor(
    private readonly attachmentsService: AttachmentsService
  ) {}

  @Post('presign')
  presign(@Body() dto: PresignDto) {
    return this.attachmentsService.createPresignedUpload(dto.fileName, dto.mimeType);
  }

  @Post('sign-get')
  signGet(@CurrentUser() user: any, @Body() dto: SignGetDto) {
    return this.attachmentsService.createPresignedDownloadForAttachment(user.sub, dto.attachmentId);
  }
}
