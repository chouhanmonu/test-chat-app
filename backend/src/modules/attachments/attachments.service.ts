import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AttachmentsService {
  private client: S3Client;

  constructor(private readonly config: ConfigService) {
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
}
