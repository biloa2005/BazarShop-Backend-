import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { MessagerieService } from './messagerie.service.js';
import { EnvoyerMessageDto } from './dto/envoyer-message.dto.js';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class MessagerieGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly messagerieService: MessagerieService,
  ) {}

  // =========================================
  // 1. AUTHENTIFICATION DE LA CONNEXION
  // =========================================

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;

      if (!token || typeof token !== 'string') {
        client.disconnect();
        return;
      }

      const tokenSansBearer = token.replace(/^Bearer\s+/i, '');

      const payload = await this.jwtService.verifyAsync(tokenSansBearer);

      // Adapter cette ligne si ton JWT utilise un autre nom de propriété.
      const idUtilisateur = payload.id ?? payload.sub;

      if (!idUtilisateur || typeof idUtilisateur !== 'string') {
        client.disconnect();
        return;
      }

      // Enregistrer l'identité vérifiée sur la socket
      client.data.userId = idUtilisateur;

      console.log(`Utilisateur connecté : ${idUtilisateur}`);
    } catch {
      client.disconnect();
    }
  }

  // =========================================
  // 2. DECONNEXION
  // =========================================

  handleDisconnect(client: Socket) {
    console.log(
      `Utilisateur déconnecté : ${client.data.userId ?? 'inconnu'}`,
    );
  }

  // =========================================
  // 3. REJOINDRE UNE CONVERSATION
  // =========================================

  @SubscribeMessage('conversation:join')
  async rejoindreConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { id_conversation: number },
  ) {
    try {
      const idUtilisateur = client.data.userId;

      if (!idUtilisateur) {
        client.disconnect();
        return { success: false, message: 'Non authentifié.' };
      }

      const idConversation = Number(data?.id_conversation);

      if (
        !Number.isSafeInteger(idConversation) ||
        idConversation <= 0
      ) {
        return {
          success: false,
          message: 'Identifiant de conversation invalide.',
        };
      }

      // Vérifier que l'utilisateur est bien participant
      await this.messagerieService.verifierParticipant(
        idConversation,
        idUtilisateur,
      );

      // Rejoindre la salle de cette conversation
      await client.join(`conversation:${idConversation}`);

      return {
        success: true,
        message: 'Conversation rejointe.',
      };
    } catch {
      return {
        success: false,
        message: 'Accès à cette conversation refusé.',
      };
    }
  }

  // =========================================
  // 4. ENVOYER UN MESSAGE EN TEMPS REEL
  // =========================================

  @SubscribeMessage('message:send')
  async envoyerMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      id_conversation: number;
      contenu: string;
    },
  ) {
    try {
      const idUtilisateur = client.data.userId;

      if (!idUtilisateur) {
        return {
          success: false,
          message: 'Non authentifié.',
        };
      }

      const idConversation = Number(data?.id_conversation);

      if (
        !Number.isSafeInteger(idConversation) ||
        idConversation <= 0
      ) {
        return {
          success: false,
          message: 'Identifiant de conversation invalide.',
        };
      }

      const dto = new EnvoyerMessageDto();
      dto.contenu = data?.contenu;

      if (
        typeof dto.contenu !== 'string' ||
        dto.contenu.trim().length === 0 ||
        dto.contenu.length > 5000
      ) {
        return {
          success: false,
          message: 'Contenu du message invalide.',
        };
      }

      // Enregistrer le message dans la base de données
      const message = await this.messagerieService.envoyerMessage(
        idConversation,
        idUtilisateur,
        dto,
      );

      // Transmettre le message à tous les participants de la salle
      this.server
        .to(`conversation:${idConversation}`)
        .emit('message:new', message);

      return {
        success: true,
        message: 'Message envoyé.',
        data: message,
      };
    } catch {
      return {
        success: false,
        message: "Impossible d'envoyer ce message.",
      };
    }
  }

  // =========================================
  // 5. SIGNALER LA LECTURE
  // =========================================

  @SubscribeMessage('conversation:read')
  async marquerCommeLu(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { id_conversation: number },
  ) {
    try {
      const idUtilisateur = client.data.userId;
      const idConversation = Number(data?.id_conversation);

      if (!idUtilisateur) {
        return { success: false, message: 'Non authentifié.' };
      }

      if (
        !Number.isSafeInteger(idConversation) ||
        idConversation <= 0
      ) {
        return { success: false, message: 'Identifiant invalide.' };
      }

      const resultat = await this.messagerieService.marquerCommeLu(
        idConversation,
        idUtilisateur,
      );

      // Informer les autres participants
      this.server
        .to(`conversation:${idConversation}`)
        .emit('conversation:read', {
          id_conversation: idConversation,
          id_utilisateur: idUtilisateur,
          date_lecture: resultat.date_lecture,
        });

      return {
        success: true,
        data: resultat,
      };
    } catch {
      return {
        success: false,
        message: 'Impossible de marquer les messages comme lus.',
      };
    }
  }
}