import { IsString,MaxLength,IsNotEmpty,IsInt,Min,IsArray,IsOptional,IsEnum } from "class-validator";
import { TypeAnnonce } from "../generated/prisma/enums.js";
import {Type} from 'class-transformer'
export class CreerAnnonceDto{
@IsString()
@IsNotEmpty()
@MaxLength(150)
titre:string;
@IsString()
@IsNotEmpty()
description:string;
@IsString()
@IsNotEmpty()
@MaxLength(191)
localisation:string;
@IsOptional()
@IsEnum(TypeAnnonce)
type?:TypeAnnonce;
@IsOptional()
@IsArray()
@Type(()=>Number)
@IsInt({each:true})
@Min(1,{each:true})
categories?:number[];
}