import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

export const prisma = new PrismaClient({
  log: [
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

prisma.$on('error', (e) => {
  logger.error(e, 'Prisma error');
});

prisma.$on('warn', (e) => {
  logger.warn(e, 'Prisma warning');
});
