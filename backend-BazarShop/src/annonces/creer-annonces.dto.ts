import { IsString,MaxLength,IsNotEmpty,isInt,Min,isArray,Type,IsOptional,IsEnum } from "class-validator";
import { TypeAnnonce } from "../generated/prisma/enums.js";

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
@isArray()
@Type(()=>Number)
@isInt({each:true})
@Min(1,{each:true})
categories?:number[];
}