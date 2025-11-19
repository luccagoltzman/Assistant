import { API_CONFIG } from '../config/constants.js';
import { HistoryManager } from '../utils/history.js';

/**
 * Serviço de integração com OpenAI
 */
export class OpenAIService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.openai.com/v1/chat/completions';
    }

    /**
     * Envia uma mensagem para a API da OpenAI
     * @param {string} message - Mensagem do usuário
     * @param {Array} conversationHistory - Histórico de conversa (opcional)
     * @returns {Promise<string>}
     */
    async sendMessage(message, conversationHistory = []) {
        if (!this.apiKey || this.apiKey === "YOUR_API_KEY_HERE") {
            throw new Error('API key não configurada');
        }

        const messages = [
            ...conversationHistory,
            { role: 'user', content: message }
        ];

        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: API_CONFIG.MODEL,
                    messages: messages,
                    max_tokens: API_CONFIG.MAX_TOKENS,
                    temperature: API_CONFIG.TEMPERATURE
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || `Erro na API: ${response.status}`;
                
                // Cria um erro customizado com informações adicionais
                const error = new Error(errorMessage);
                error.status = response.status;
                error.type = errorData.error?.type || 'unknown';
                error.code = errorData.error?.code || null;
                
                throw error;
            }

            const data = await response.json();
            
            if (data.choices && data.choices.length > 0) {
                const reply = data.choices[0].message.content;
                
                // Salva no histórico
                HistoryManager.add(message, reply);
                
                return reply;
            } else {
                throw new Error('Resposta vazia da API');
            }
        } catch (error) {
            console.error('Erro na API OpenAI:', error);
            throw error;
        }
    }

    /**
     * Analisa uma imagem usando a API Vision da OpenAI
     * @param {string} imageBase64 - Imagem em base64 (sem prefixo data:image/...)
     * @param {string} prompt - Prompt para análise da imagem
     * @returns {Promise<string>}
     */
    async analyzeImage(imageBase64, prompt = 'Identifique e descreva todos os objetos visíveis nesta imagem. Liste os objetos encontrados e forneça uma descrição detalhada do que você vê.') {
        if (!this.apiKey || this.apiKey === "YOUR_API_KEY_HERE") {
            throw new Error('API key não configurada');
        }

        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o', // Modelo com suporte a visão
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: prompt
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `data:image/jpeg;base64,${imageBase64}`
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: API_CONFIG.MAX_TOKENS,
                    temperature: API_CONFIG.TEMPERATURE
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || `Erro na API: ${response.status}`;
                
                const error = new Error(errorMessage);
                error.status = response.status;
                error.type = errorData.error?.type || 'unknown';
                error.code = errorData.error?.code || null;
                
                throw error;
            }

            const data = await response.json();
            
            if (data.choices && data.choices.length > 0) {
                const reply = data.choices[0].message.content;
                
                // Salva no histórico
                HistoryManager.add('Análise de imagem', reply);
                
                return reply;
            } else {
                throw new Error('Resposta vazia da API');
            }
        } catch (error) {
            console.error('Erro na API Vision OpenAI:', error);
            throw error;
        }
    }

    /**
     * Verifica se a API key é válida
     * @returns {Promise<boolean>}
     */
    async validateApiKey() {
        if (!this.apiKey || this.apiKey === "YOUR_API_KEY_HERE") {
            return false;
        }

        try {
            await this.sendMessage('teste');
            return true;
        } catch (error) {
            return false;
        }
    }
}

