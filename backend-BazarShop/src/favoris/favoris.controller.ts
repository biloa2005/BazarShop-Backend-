import { Controller, Post, UseGuards } from '@nestjs/common';
import { FavorisService } from './favoris.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AjouterFavoriDto } from './ajouter-favori.dto.js';
type RequeteAuthentifiee=Request & {
    user:{
        id:string
    };
};
@Controller('favoris')
@UseGuards(JwtAuthGuard)
export class FavorisController {
    constructor(
        private readonly favorisService:FavorisService
    ){}
    //AJOUTER UNE FAVORIS
    @Post()
    ajouter(
        @Body()dto:AjouterFavoriDto, @Req() req:RequeteAuthentifiee,
    ){
        return this.favorisService.ajouter(req.user.id,dto.id_annonce)
    }
    


}
