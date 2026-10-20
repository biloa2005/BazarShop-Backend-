import { PartialType } from '@nestjs/mapped-types';
import { CreateUtilisateurDto } from './create-utilisateur.dto.js';

export class UpdateUtilisateurDto extends PartialType(CreateUtilisateurDto) {}
