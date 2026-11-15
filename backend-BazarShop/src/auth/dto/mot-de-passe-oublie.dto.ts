import { IsEmail } from 'class-validator';

export class MotDePasseOublieDto {
  @IsEmail()
  email: string;
}