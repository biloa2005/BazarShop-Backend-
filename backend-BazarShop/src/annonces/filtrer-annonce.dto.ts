import {IsInt,IsOptional,IsString,IsEnum,Min,Max} from 'class-validator'
import {Type} from "class-transformer"
import { TypeAnnonce } from '../generated/prisma/enums.js';
export class FilterAnnonceDto{
    @IsOptional()
    @IsString()
    recherche?:string;
    @IsOptional()
    @IsEnum(TypeAnnonce)
    type?:TypeAnnonce;
    @IsOptional()
    @Type(()=>Number)
    @IsInt()
    @Min(1)
    page?:number=1
@IsOptional()
    @Type(()=>Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limite?:number=10    
}