import { IsInt, Max, Min,MaxLength,IsString,IsOptional } from "class-validator";
export class CreerAvisDto{
    //note comprise entre 1 et 5
    @IsInt()
    @Min(1)
    @Max(5)
    note!:number;
    //le comentaire facultatif
    @IsOptional()
    @IsString()
    @MaxLength(200)
commentaire?: string
}