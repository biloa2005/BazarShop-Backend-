import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreerConversationDto } from './dto/creer-conversation.dto.js';
import { EnvoyerMessageDto } from './dto/envoyer-message.dto.js';

@Injectable()
export class MessagerieService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================
  // 1. CREER OU RETROUVER UNE CONVERSATION
  // =========================================

  async creerConversation(
    idUtilisateur: string,
    dto: CreerConversationDto,
  ) {
    const idDestinataire = dto.id_destinataire;

    // Empêcher un utilisateur de s'écrire à lui-même
    if (idUtilisateur === idDestinataire) {
      throw new BadRequestException(
        'Vous ne pouvez pas créer une conversation avec vous-même.',
      );
    }

    // Vérifier que le destinataire existe
    const destinataire = await this.prisma.utilisateur.findUnique({
      where: {
        id_utilisateur: idDestinataire,
      },
      select: {
        id_utilisateur: true,
        nom: true,
        prenom: true,
      },
    });

    if (!destinataire) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    // Rechercher les conversations auxquelles participent les deux utilisateurs
    const conversations = await this.prisma.conversation.findMany({
      where: {
        AND: [
          {
            participants: {
              some: {
                id_utilisateur: idUtilisateur,
              },
            },
          },
          {
            participants: {
              some: {
                id_utilisateur: idDestinataire,
              },
            },
          },
        ],
      },
      include: {
        participants: true,
      },
    });

    // Vérifier qu'il s'agit bien d'une conversation privée à deux
    const conversationExistante = conversations.find(
      (conversation) =>
        conversation.participants.length === 2,
    );

    if (conversationExistante) {
      return conversationExistante;
    }

    // Créer une nouvelle conversation et ses deux participants
    return this.prisma.conversation.create({
      data: {
        participants: {
          create: [
            {
              id_utilisateur: idUtilisateur,
            },
            {
              id_utilisateur: idDestinataire,
            },
          ],
        },
      },
      include: {
        participants: {
          include: {
            utilisateur: {
              select: {
                id_utilisateur: true,
                nom: true,
                prenom: true,
              },
            },
          },
        },
      },
    });
  }

  // =========================================
  // 2. VERIFIER LA PARTICIPATION
  // =========================================

  async verifierParticipant(
    idConversation: number,
    idUtilisateur: string,
  ) {
    const participant =
      await this.prisma.conversationParticipant.findUnique({
        where: {
          id_conversation_id_utilisateur: {
            id_conversation: idConversation,
            id_utilisateur: idUtilisateur,
          },
        },
      });

    if (!participant) {
      throw new ForbiddenException(
        "Vous ne participez pas à cette conversation.",
      );
    }

    return participant;
  }

  // =========================================
  // 3. ENVOYER UN MESSAGE
  // =========================================

  async envoyerMessage(
    idConversation: number,
    idExpediteur: string,
    dto: EnvoyerMessageDto,
  ) {
    // Vérifier que l'expéditeur participe à la conversation
    await this.verifierParticipant(
      idConversation,
      idExpediteur,
    );

    const contenu = dto.contenu.trim();

    if (!contenu) {
      throw new BadRequestException(
        'Le message ne peut pas être vide.',
      );
    }

    // Enregistrer le message dans MySQL
    return this.prisma.message.create({
      data: {
        contenu,
        id_conversation: idConversation,
        id_expediteur: idExpediteur,
      },
      include: {
        expediteur: {
          select: {
            id_utilisateur: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });
  }

  // =========================================
  // 4. LISTER LES CONVERSATIONS
  // =========================================

  async listerConversations(idUtilisateur: string) {
    return this.prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            id_utilisateur: idUtilisateur,
          },
        },
      },

      include: {
        participants: {
          include: {
            utilisateur: {
              select: {
                id_utilisateur: true,
                nom: true,
                prenom: true,
              },
            },
          },
        },

        messages: {
          orderBy: {
            date_envoi: 'desc',
          },
          take: 1,
          include: {
            expediteur: {
              select: {
                id_utilisateur: true,
                nom: true,
                prenom: true,
              },
            },
          },
        },
      },

      orderBy: {
        date_creation: 'desc',
      },
    });
  }

  // =========================================
  // 5. HISTORIQUE DES MESSAGES
  // =========================================

  async historiqueMessages(
    idConversation: number,
    idUtilisateur: string,
  ) {
    await this.verifierParticipant(
      idConversation,
      idUtilisateur,
    );

    return this.prisma.message.findMany({
      where: {
        id_conversation: idConversation,
      },

      include: {
        expediteur: {
          select: {
            id_utilisateur: true,
            nom: true,
            prenom: true,
          },
        },
      },

      orderBy: {
        date_envoi: 'asc',
      },
    });
  }

  // =========================================
  // 6. MARQUER LES MESSAGES COMME LUS
  // =========================================

  async marquerCommeLu(
    idConversation: number,
    idUtilisateur: string,
  ) {
    await this.verifierParticipant(
      idConversation,
      idUtilisateur,
    );

    const maintenant = new Date();

    // Mettre à jour la date de lecture de ce participant
    await this.prisma.conversationParticipant.update({
      where: {
        id_conversation_id_utilisateur: {
          id_conversation: idConversation,
          id_utilisateur: idUtilisateur,
        },
      },
      data: {
        date_lecture: maintenant,
      },
    });

    // Dans cette messagerie privée, marquer comme lus
    // les messages reçus avant cette date.
    await this.prisma.message.updateMany({
      where: {
        id_conversation: idConversation,
        id_expediteur: {
          not: idUtilisateur,
        },
        est_lu: false,
        date_envoi: {
          lte: maintenant,
        },
      },
      data: {
        est_lu: true,
      },
    });

    return {
      message: 'Messages marqués comme lus.',
      date_lecture: maintenant,
    };
  }
}