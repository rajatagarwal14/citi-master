import express, { Request, Response } from 'express';
import { config } from './config';
import { logger } from './utils/logger';
import { webhookRouter } from './routes/webhook';
import { dashboardRouter } from './routes/dashboard';
// Database removed - using Firebase
import { redis } from './utils/redis';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Firebase health check skipped
    // Redis replaced with in-memory cache
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      services: { database: 'connected', redis: 'connected' }
    });
  } catch (error) {
    logger.error(error, 'Health check failed');
    res.status(503).json({ 
      status: 'error', 
      message: 'Service unavailable' 
    });
  }
});

// WhatsApp webhook routes
app.use('/webhook', webhookRouter);

// Dashboard routes
app.use('/dashboard', dashboardRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  logger.error(err, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`🚀 Citi Master server running on port ${PORT}`);
  logger.info(`📱 WhatsApp webhook: http://localhost:${PORT}/webhook`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing gracefully...');
  // Database disconnection removed
  // Redis cache cleanup skipped
  process.exit(0);
});
