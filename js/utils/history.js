import { StorageManager } from './storage.js';
import { STORAGE_KEYS } from '../config/constants.js';

/**
 * Gerenciador de histórico de conversas
 */
export class HistoryManager {
    static MAX_HISTORY = 100;

    /**
     * Adiciona uma entrada ao histórico
     * @param {string} userMessage - Mensagem do usuário
     * @param {string} assistantResponse - Resposta do assistente
     */
    static add(userMessage, assistantResponse) {
        const history = this.getAll();
        const entry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            user: userMessage,
            assistant: assistantResponse,
        };

        history.unshift(entry);
        
        // Mantém apenas os últimos MAX_HISTORY itens
        if (history.length > this.MAX_HISTORY) {
            history.pop();
        }

        StorageManager.save(STORAGE_KEYS.HISTORY, history);
        return entry;
    }

    /**
     * Recupera todo o histórico
     * @returns {Array}
     */
    static getAll() {
        return StorageManager.get(STORAGE_KEYS.HISTORY, []);
    }

    /**
     * Limpa o histórico
     */
    static clear() {
        StorageManager.remove(STORAGE_KEYS.HISTORY);
    }

    /**
     * Remove uma entrada específica do histórico
     * @param {number} id - ID da entrada
     */
    static remove(id) {
        const history = this.getAll();
        const filtered = history.filter(entry => entry.id !== id);
        StorageManager.save(STORAGE_KEYS.HISTORY, filtered);
    }

    /**
     * Exporta o histórico como JSON
     * @returns {string}
     */
    static export() {
        return JSON.stringify(this.getAll(), null, 2);
    }
}

