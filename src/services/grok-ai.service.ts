import OpenAI from 'openai';
import { config } from '../config';
import { logger } from './logger';

export class GrokAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.grok.apiKey,
      baseURL: 'https://api.x.ai/v1',
    });
  }

  /**
   * Extract intent and entities from user message
   */
  async parseIntent(userMessage: string, conversationHistory: string[] = []): Promise<{
    intent: 'SERVICE_REQUEST' | 'QUERY' | 'COMPLAINT' | 'GREETING' | 'UNKNOWN';
    category?: string;
    subcategory?: string;
    urgency?: 'URGENT' | 'NORMAL' | 'FLEXIBLE';
    location?: string;
    confidence: number;
  }> {
    try {
      const systemPrompt = `You are an AI assistant for Citi Master, a home services platform in India. 
Analyze user messages and extract:
1. Intent: SERVICE_REQUEST, QUERY, COMPLAINT, GREETING, UNKNOWN
2. Service category: AC, CLEANING, PLUMBING, ELECTRICAL, PAINTING, CARPENTER
3. Subcategory: AC_REPAIR, AC_INSTALLATION, DEEP_CLEANING, LEAK_REPAIR, etc.
4. Urgency: URGENT, NORMAL, FLEXIBLE
5. Location if mentioned

Respond ONLY with valid JSON. Handle Hindi/Hinglish text.`;

      const response = await this.client.chat.completions.create({
        model: 'grok-beta',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.map((msg, i) => ({
            role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
            content: msg
          })),
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const content = response.choices[0].message.content || '{}';
      const parsed = JSON.parse(content);
      
      logger.debug({ userMessage, parsed }, 'Grok intent parsing');
      
      return {
        intent: parsed.intent || 'UNKNOWN',
        category: parsed.category,
        subcategory: parsed.subcategory,
        urgency: parsed.urgency,
        location: parsed.location,
        confidence: parsed.confidence || 0.5,
      };
    } catch (error) {
      logger.error(error, 'Grok AI error');
      return {
        intent: 'UNKNOWN',
        confidence: 0,
      };
    }
  }

  /**
   * Generate smart response for customer queries
   */
  async generateResponse(
    userMessage: string,
    context: {
      customerName?: string;
      language: 'en' | 'hi';
      category?: string;
      conversationHistory?: string[];
    }
  ): Promise<string> {
    try {
      const systemPrompt = `You are Citi Master's AI assistant for home services in India.
- Be helpful, concise, friendly
- Use ${context.language === 'hi' ? 'Hindi/Hinglish' : 'English'}
- Keep responses under 160 characters (WhatsApp friendly)
- Don't make promises about pricing or availability
- Guide users to book services through our platform
${context.customerName ? `- Customer name: ${context.customerName}` : ''}
${context.category ? `- Current service: ${context.category}` : ''}`;

      const response = await this.client.chat.completions.create({
        model: 'grok-beta',
        messages: [
          { role: 'system', content: systemPrompt },
          ...(context.conversationHistory || []).map((msg, i) => ({
            role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
            content: msg
          })),
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 100,
      });

      return response.choices[0].message.content || 'I can help you book a service. What do you need?';
    } catch (error) {
      logger.error(error, 'Grok response generation error');
      return context.language === 'hi' 
        ? 'मैं आपकी मदद कर सकता हूं। कौनसी सर्विस चाहिए?'
        : 'I can help you book a service. What do you need?';
    }
  }

  /**
   * Detect language from text
   */
  async detectLanguage(text: string): Promise<'en' | 'hi'> {
    // Simple heuristic: if contains Devanagari script, it's Hindi
    const hindiPattern = /[\u0900-\u097F]/;
    if (hindiPattern.test(text)) return 'hi';
    
    // Check for common Hinglish words
    const hinglishWords = ['kya', 'hai', 'chahiye', 'kar', 'nahi', 'acha', 'theek'];
    const lowerText = text.toLowerCase();
    const hasHinglish = hinglishWords.some(word => lowerText.includes(word));
    
    return hasHinglish ? 'hi' : 'en';
  }

  /**
   * Extract address components from free text
   */
  async parseAddress(addressText: string): Promise<{
    street?: string;
    area?: string;
    city?: string;
    pincode?: string;
    landmark?: string;
  }> {
    try {
      const systemPrompt = `Extract address components from Indian addresses.
Return JSON with: street, area, city, pincode, landmark.
Example: "Near Metro, Karol Bagh, Delhi 110005" -> {"area": "Karol Bagh", "city": "Delhi", "pincode": "110005", "landmark": "Near Metro"}`;

      const response = await this.client.chat.completions.create({
        model: 'grok-beta',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: addressText }
        ],
        temperature: 0.2,
        max_tokens: 150,
      });

      const content = response.choices[0].message.content || '{}';
      return JSON.parse(content);
    } catch (error) {
      logger.error(error, 'Address parsing error');
      return { street: addressText };
    }
  }
}
