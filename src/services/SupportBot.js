/**
 * Support Bot Service
 * Handles automated responses and bot interactions
 */

class SupportBot {
  constructor() {
    this.responses = {
      greeting: [
        "Hello! How can I help you today?",
        "Hi there! What can I assist you with?",
        "Welcome! How may I help you?",
      ],
      order: [
        "I can help you with your order. Please provide your order number.",
        "For order inquiries, please share your order ID.",
      ],
      product: [
        "I'd be happy to help with product information. What product are you interested in?",
        "Tell me which product you'd like to know more about.",
      ],
      shipping: [
        "For shipping questions, please provide your order number or tracking ID.",
        "I can help with shipping information. What would you like to know?",
      ],
      default: [
        "I'm here to help! Could you provide more details?",
        "Let me connect you with a support agent for better assistance.",
      ],
    };
  }

  /**
   * Analyze message and generate response
   */
  analyzeMessage(message) {
    const lowerMessage = message.toLowerCase();

    if (this.matches(lowerMessage, ['hi', 'hello', 'hey', 'greetings'])) {
      return this.getRandomResponse('greeting');
    }

    if (this.matches(lowerMessage, ['order', 'purchase', 'buy', 'ordered'])) {
      return this.getRandomResponse('order');
    }

    if (this.matches(lowerMessage, ['product', 'item', 'goods'])) {
      return this.getRandomResponse('product');
    }

    if (this.matches(lowerMessage, ['shipping', 'delivery', 'ship', 'deliver'])) {
      return this.getRandomResponse('shipping');
    }


    return this.getRandomResponse('default');
  }

  /**
   * Check if message matches any keywords
   */
  matches(message, keywords) {
    return keywords.some((keyword) => message.includes(keyword));
  }

  /**
   * Get random response from category
   */
  getRandomResponse(category) {
    const responses = this.responses[category] || this.responses.default;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Process incoming message and return bot response
   */
  processMessage(message) {
    // Add a small delay to simulate thinking
    return new Promise((resolve) => {
      setTimeout(() => {
        const response = this.analyzeMessage(message);
        resolve(response);
      }, 1000);
    });
  }
}

const supportBot = new SupportBot();

export default supportBot;

