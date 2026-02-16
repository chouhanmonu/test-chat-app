import { Body, Controller, Post, UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AttachmentsService } from './attachments.service';
import { PresignDto } from './dto/presign.dto';
import { SignGetDto } from './dto/sign-get.dto';
import { MessagesService } from '../messages/messages.service';

@Controller('attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
  constructor(
    private readonly attachmentsService: AttachmentsService,
    private readonly messagesService: MessagesService
  ) {}

  @Post('presign')
  presign(@Body() dto: PresignDto) {
    return this.attachmentsService.createPresignedUpload(dto.fileName, dto.mimeType);
  }

  @Post('sign-get')
  async signGet(@CurrentUser() user: any, @Body() dto: SignGetDto) {
    const allowed = await this.messagesService.canAccessAttachment(user.sub, dto.key);
    if (!allowed) {
      throw new ForbiddenException();
    }
    return this.attachmentsService.createPresignedDownload(dto.key);
  }
}
