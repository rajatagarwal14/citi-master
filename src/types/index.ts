export interface IncomingMessage {
  from: string;
  messageId: string;
  timestamp: number;
  type: 'text' | 'interactive' | 'button' | 'image' | 'document';
  text?: string;
  buttonReply?: {
    id: string;
    title: string;
  };
  listReply?: {
    id: string;
    title: string;
    description?: string;
  };
}

export interface ConversationState {
  step: 'START' | 'CATEGORY' | 'SUBCATEGORY' | 'ADDRESS' | 'SLOT' | 'CONFIRM' | 'ASSIGNED' | 'FEEDBACK' | 'VENDOR_NAME' | 'VENDOR_BUSINESS' | 'VENDOR_SERVICES' | 'VENDOR_ADDRESS' | 'CHAT' | 'CALLBACK_REQUEST';
  category?: string;
  subcategory?: string;
  address?: any;
  slot?: string;
  leadId?: string;
  language: 'en' | 'hi';
  vendorData?: {
    ownerName?: string;
    businessName?: string;
    serviceCategories?: string[];
    serviceAreas?: string[];
  };
  chatMessages?: Array<{role: 'user' | 'assistant', content: string}>;
  callbackRequested?: boolean;
}

export interface VendorMatch {
  vendorId: string;
  score: number;
  businessName: string;
  rating: number;
  distance: number;
  priceRange: string;
}

export const CATEGORIES = {
  AC: { en: 'AC Service', hi: 'AC सर्विस' },
  CLEANING: { en: 'Cleaning', hi: 'सफाई' },
  PLUMBING: { en: 'Plumbing', hi: 'नलसाज़ी' },
  ELECTRICAL: { en: 'Electrical', hi: 'बिजली' },
  PAINTING: { en: 'Painting', hi: 'पेंटिंग' },
  CARPENTER: { en: 'Carpentry', hi: 'बढ़ई' },
} as const;

export const SUBCATEGORIES = {
  AC_REPAIR: { en: 'AC Repair', hi: 'AC रिपेयर' },
  AC_INSTALLATION: { en: 'AC Installation', hi: 'AC लगाना' },
  AC_MAINTENANCE: { en: 'AC Service', hi: 'AC सर्विसिंग' },
  DEEP_CLEANING: { en: 'Deep Cleaning', hi: 'डीप क्लीनिंग' },
  REGULAR_CLEANING: { en: 'Regular Cleaning', hi: 'नियमित सफाई' },
  KITCHEN_CLEANING: { en: 'Kitchen Cleaning', hi: 'रसोई सफाई' },
  LEAK_REPAIR: { en: 'Leak Repair', hi: 'लीक रिपेयर' },
  PIPE_INSTALLATION: { en: 'Pipe Work', hi: 'पाइप काम' },
  BATHROOM_FITTING: { en: 'Bathroom Fitting', hi: 'बाथरूम फिटिंग' },
} as const;
