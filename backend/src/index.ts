import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config';
import { errorMiddleware } from './middleware/errorMiddleware';
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import listingRoutes from './routes/listingRoutes';
import interestRoutes from './routes/interestRoutes';
import chatRoutes from './routes/chatRoutes';
import adminRoutes from './routes/adminRoutes';
import { SocketService } from './services/socketService';

const app = express();
const server = createServer(app);

// Enable CORS
app.use(cors({
  origin: '*', // Allow all in dev, configure as needed for production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser - limit set to 10mb to handle base64 image uploads for room photos
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Mount Routes
app.use('/auth', authRoutes);
app.use('/tenant', profileRoutes);
app.use('/', listingRoutes);
app.use('/', interestRoutes);
app.use('/', chatRoutes);
app.use('/admin', adminRoutes);

// Catch-all route for unknown endpoints
app.use((req, res, next) => {
  res.status(404).json({ error: `Not Found: ${req.method} ${req.url}` });
});

// Error handling middleware
app.use(errorMiddleware);

// Initialize WebSockets
const socketService = new SocketService(server);

// Start server
const port = config.port;
server.listen(port, () => {
  console.log(`==================================================`);
  console.log(`Rent & Flatmate Finder API running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`LLM Provider: ${config.llmProvider}`);
  console.log(`==================================================`);
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
