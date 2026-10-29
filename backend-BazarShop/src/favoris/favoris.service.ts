import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { StatutAnnonce } from '../generated/prisma/enums.js';

@Injectable()
export class FavorisService {
    constructor(private readonly prisma: PrismaService){}
    //1. ajouter une annonce aux favoris
    async ajouter(idUtilisateur:string, idAnnonce:string){
        //verififier que l'annonce existe et est active
        const annonce= await this.prisma.annonce.findFirst({
            where:{
                id_annonce:idAnnonce,
                statut:StatutAnnonce.ACTIVE,
            },
            select:{
                id_annonce:true
            },
        });
        if(!annonce){
            throw new NotFoundException("Annonce introuvable ou inactive.");
        }
        //si le favori existe deja , on le conserve sans erreur.
        return this.prisma.favori.upsert({
            where:{
                id_utilisateur_id_annonce:{
                    id_utilisateur:idUtilisateur,
                    id_annonce:idAnnonce,
                },
            },
            update:{},
            create:{
                id_utilisateur:idUtilisateur,
                id_annonce:idAnnonce,
            },
            include:{
                annonce:true
            }
        })
    }
    //2.consulter les favoris d'un users
    async lister(idUtilisateur:string){
        return
        this.prisma.favori.findMany({
            where:{
                id_utilisateur:idUtilisateur,
            },
            orderBy:{
                date_ajout:"desc"
            },
            include:{
                annonce:{
                    include:{
                        proprietaire:{
                            select:{
                                id_utilisateur:true,
                                nom:true,
                                prenom:true
                            }
                        },
                        photos:{
                            orderBy:{
                                ordre:"asc"
                            },
                        },
                        categories:{
                            include:{
                                categorie:true,
                            }
                        }
                    }
                }
            }
        })
    }
//3. verifier si une annonce est dans les favoris

}
