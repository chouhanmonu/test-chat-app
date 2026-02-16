import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attachment, AttachmentDocument } from './schemas/attachment.schema';
import { RoomsService } from '../rooms/rooms.service';

@Injectable()
export class AttachmentsService {
  private client: S3Client;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(Attachment.name) private readonly attachmentModel: Model<AttachmentDocument>,
    private readonly roomsService: RoomsService
  ) {
    this.client = new S3Client({
      region: this.config.get<string>('doSpacesRegion'),
      endpoint: this.config.get<string>('doSpacesEndpoint'),
      credentials: {
        accessKeyId: this.config.get<string>('doSpacesKey'),
        secretAccessKey: this.config.get<string>('doSpacesSecret')
      }
    });
  }

  async createPresignedUpload(fileName: string, mimeType: string) {
    const bucket = this.config.get<string>('doSpacesBucket');
    const key = `${uuid()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: mimeType,
      ACL: 'private'
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 60 * 5 });
    const fileUrl = `${this.config.get<string>('doSpacesEndpoint')}/${bucket}/${key}`;

    return { uploadUrl, fileUrl, key };
  }

  async createPresignedDownloadForAttachment(userId: string, attachmentId: string) {
    const attachment = await this.attachmentModel.findById(attachmentId).exec();
    if (!attachment) throw new NotFoundException('Attachment not found');

    const allowed = await this.roomsService.isMember(attachment.roomId.toString(), userId);
    if (!allowed) throw new ForbiddenException();

    const command = new GetObjectCommand({
      Bucket: attachment.bucket,
      Key: attachment.key
    });
    const downloadUrl = await getSignedUrl(this.client, command, { expiresIn: 60 * 10 });
    return { downloadUrl, attachmentId };
  }

  async createAttachmentRecord(params: {
    key: string;
    bucket: string;
    mimeType: string;
    fileName: string;
    size: number;
    uploaderId: string;
    roomId: string;
    messageId: string;
  }) {
    return this.attachmentModel.create({
      key: params.key,
      bucket: params.bucket,
      mimeType: params.mimeType,
      fileName: params.fileName,
      size: params.size,
      uploaderId: new Types.ObjectId(params.uploaderId),
      roomId: new Types.ObjectId(params.roomId),
      messageId: new Types.ObjectId(params.messageId)
    });
  }
}
