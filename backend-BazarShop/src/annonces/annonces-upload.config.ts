import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';

export const DOSSIER_PHOTOS = join(process.cwd(), 'uploads', 'annonces');
export const URL_PHOTOS = '/uploads/annonces';
export const MAX_PHOTOS = 5;

mkdirSync(DOSSIER_PHOTOS, { recursive: true });

export const optionsUploadPhotos = {
  storage: diskStorage({
    destination: DOSSIER_PHOTOS,
    // Nom aléatoire : jamais le nom envoyé par le client.
    filename: (_req, file, cb) =>
      cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: MAX_PHOTOS },
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    cb: (err: Error | null, accept: boolean) => void,
  ) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype)) {
      return cb(
        new BadRequestException('Formats acceptés : JPEG, PNG, WEBP.'),
        false,
      );
    }
    cb(null, true);
  },
};