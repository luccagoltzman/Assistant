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
     * Extrai texto de um documento usando OCR (Optical Character Recognition)
     * @param {string} imageBase64 - Imagem em base64 (sem prefixo data:image/...)
     * @returns {Promise<string>}
     */
    async extractTextFromDocument(imageBase64) {
        if (!this.apiKey || this.apiKey === "YOUR_API_KEY_HERE") {
            throw new Error('API key não configurada');
        }

        const prompt = `Extraia TODO o texto visível nesta imagem de documento. 

INSTRUÇÕES IMPORTANTES:
1. Extraia TODO o texto, palavra por palavra, exatamente como aparece
2. Mantenha a formatação original (quebras de linha, parágrafos, espaçamento)
3. Preserve a ordem do texto (de cima para baixo, da esquerda para direita)
4. Se houver tabelas, mantenha a estrutura
5. Se houver listas numeradas ou com marcadores, mantenha a formatação
6. Não adicione interpretações ou explicações - apenas o texto puro
7. Se algum texto estiver ilegível, indique com [texto ilegível]
8. Retorne APENAS o texto extraído, sem comentários adicionais

FORMATO DE SAÍDA:
Retorne o texto exatamente como aparece no documento, preservando formatação e estrutura.`;

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
                                        url: `data:image/jpeg;base64,${imageBase64}`,
                                        detail: 'high' // Alta qualidade para melhor OCR
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 4096, // Mais tokens para documentos longos
                    temperature: 0.1 // Baixa temperatura para precisão
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
                const extractedText = data.choices[0].message.content;
                
                // Salva no histórico
                HistoryManager.add('Leitura de documento', extractedText);
                
                return extractedText;
            } else {
                throw new Error('Resposta vazia da API');
            }
        } catch (error) {
            console.error('Erro no OCR:', error);
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

