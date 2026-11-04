import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreerConversationDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  id_destinataire: string;
}