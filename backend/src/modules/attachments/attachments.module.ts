import { Module } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Attachment, AttachmentSchema } from './schemas/attachment.schema';
import { RoomsModule } from '../rooms/rooms.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Attachment.name, schema: AttachmentSchema }]), RoomsModule],
  providers: [AttachmentsService],
  controllers: [AttachmentsController],
  exports: [AttachmentsService]
})
export class AttachmentsModule {}
