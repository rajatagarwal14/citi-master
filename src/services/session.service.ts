import { ConversationState } from '../types';
import { redis } from '../utils/redis';
import { config } from '../config';

export class SessionService {
  private readonly prefix = 'session:';
  private readonly ttl = config.business.sessionTtl;

  async getState(phoneNumber: string): Promise<ConversationState> {
    const key = this.prefix + phoneNumber;
    const data = await redis.get(key);

    if (data) {
      return JSON.parse(data);
    }

    // Default state
    return {
      step: 'START',
      language: 'en',
    };
  }

  async setState(phoneNumber: string, state: ConversationState): Promise<void> {
    const key = this.prefix + phoneNumber;
    await redis.setex(key, this.ttl, JSON.stringify(state));
  }

  async clearState(phoneNumber: string): Promise<void> {
    const key = this.prefix + phoneNumber;
    await redis.del(key);
  }
}
