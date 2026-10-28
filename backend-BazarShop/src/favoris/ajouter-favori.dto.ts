import {IsString,IsUUID,IsNotEmpty} from "class-validator"
export class AjouterFavoriDto{
    @IsString()
    @IsNotEmpty()
        @IsUUID()
        id_annonce!:string;
    
}