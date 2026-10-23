import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AnnoncesService {
    constructor(
        private readonly prisma: PrismaService
    ){}
    //verifier que toute les categories existe
    private async verifierCategories(ids?:number[]){
        if(!ids || ids.length===0){
            return;
        }
        if(new Set(ids).size !== ids.length){
            
        }
    }
}
