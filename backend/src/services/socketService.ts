import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../lib/prisma';

export class SocketService {
  private io: Server;

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: '*', // Allow all origins for development
        methods: ['GET', 'POST'],
      },
    });

    this.setupMiddleware();
    this.setupConnectionHandler();
  }

  private setupMiddleware() {
    this.io.use((socket: Socket, next) => {
      // Look for token in auth payload or query parameters
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;

      if (!token || typeof token !== 'string') {
        return next(new Error('Authentication error: Token missing or invalid'));
      }

      try {
        const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; email: string; role: string };
        socket.data.user = decoded;
        next();
      } catch (err) {
        return next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  private setupConnectionHandler() {
    this.io.on('connection', (socket: Socket) => {
      const user = socket.data.user;
      console.log(`WebSocket Connected: ${user.email} (${socket.id})`);

      socket.on('join_room', async ({ interestRequestId }: { interestRequestId: string }) => {
        try {
          if (!interestRequestId) {
            socket.emit('error_message', { message: 'Interest Request ID is required' });
            return;
          }

          // Ensure the interest request exists and has status ACCEPTED
          const interest = await prisma.interestRequest.findUnique({
            where: { id: interestRequestId },
            include: { listing: true },
          });

          if (!interest) {
            socket.emit('error_message', { message: 'Interest request not found' });
            return;
          }

          if (interest.status !== 'ACCEPTED') {
            socket.emit('error_message', { message: 'Chat room is locked until interest is accepted' });
            return;
          }

          // Authorize access: must be the tenant or listing owner
          const isAuthorized = interest.tenantId === user.userId || interest.listing.ownerId === user.userId;
          if (!isAuthorized) {
            socket.emit('error_message', { message: 'Not authorized to join this chat' });
            return;
          }

          const roomName = `room_${interestRequestId}`;
          socket.join(roomName);
          console.log(`WebSocket: User ${user.email} joined room ${roomName}`);
        } catch (err) {
          console.error('Error joining chat room:', err);
          socket.emit('error_message', { message: 'Failed to join chat room' });
        }
      });

      socket.on('send_message', async ({ interestRequestId, content }: { interestRequestId: string; content: string }) => {
        try {
          if (!interestRequestId || !content || content.trim() === '') {
            return;
          }

          // Validate listing / interest request
          const interest = await prisma.interestRequest.findUnique({
            where: { id: interestRequestId },
            include: { listing: true },
          });

          if (!interest || interest.status !== 'ACCEPTED') {
            socket.emit('error_message', { message: 'Interest request not accepted or does not exist' });
            return;
          }

          // Authorize sender
          const isAuthorized = interest.tenantId === user.userId || interest.listing.ownerId === user.userId;
          if (!isAuthorized) {
            socket.emit('error_message', { message: 'Not authorized to send messages to this chat' });
            return;
          }

          // Save message to database
          const message = await prisma.message.create({
            data: {
              interestRequestId,
              senderId: user.userId,
              content: content.trim(),
            },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
          });

          const roomName = `room_${interestRequestId}`;
          // Send to everyone in the room (including sender)
          this.io.to(roomName).emit('new_message', message);
        } catch (err) {
          console.error('Error sending WebSocket message:', err);
          socket.emit('error_message', { message: 'Failed to save or broadcast message' });
        }
      });

      socket.on('typing', ({ interestRequestId, isTyping }: { interestRequestId: string; isTyping: boolean }) => {
        if (!interestRequestId) return;
        const roomName = `room_${interestRequestId}`;
        socket.to(roomName).emit('typing', { senderId: user.userId, isTyping });
      });

      socket.on('disconnect', () => {
        console.log(`WebSocket Disconnected: ${user.email} (${socket.id})`);
      });
    });
  }
}
export default SocketService;
