import { Controller, Get, Post, UseGuards,Req,Delete,Param,Body } from '@nestjs/common';
import { FavorisService } from './favoris.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AjouterFavoriDto } from './ajouter-favori.dto.js';
import type { Request } from 'express';
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
    
//consulter les favoris de l'utilisateur connecter
@Get()
lister(@Req() req:RequeteAuthentifiee){
    return this.favorisService.lister(req.user.id)
}
//verifier si une annonce est dans les favoris

@Get(":idAnnonce/verifier")
verifier(@Param('idAnnonce') idAnnonce:string, @Req req:RequeteAuthentifiee){
    return this.favorisService.verifier(
        req.user.id,
        idAnnonce,
    );
}
//retirer une annonce des favoris
@Delete(':idAnnonce')
retirer(@Param("idAnnonce") idAnnonce:string, @Req() req:RequeteAuthentifiee){
    return this.favorisService.retirer(
        req.user.id,
        idAnnonce,
    )
}

}
