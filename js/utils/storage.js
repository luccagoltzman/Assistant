/**
 * Utilitário para gerenciamento de localStorage
 */
export class StorageManager {
    /**
     * Salva dados no localStorage
     * @param {string} key - Chave de armazenamento
     * @param {any} data - Dados a serem salvos
     */
    static save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
            return false;
        }
    }

    /**
     * Recupera dados do localStorage
     * @param {string} key - Chave de armazenamento
     * @param {any} defaultValue - Valor padrão se não encontrar
     * @returns {any}
     */
    static get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Erro ao recuperar do localStorage:', error);
            return defaultValue;
        }
    }

    /**
     * Remove dados do localStorage
     * @param {string} key - Chave a ser removida
     */
    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Erro ao remover do localStorage:', error);
            return false;
        }
    }

    /**
     * Limpa todo o localStorage
     */
    static clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Erro ao limpar localStorage:', error);
            return false;
        }
    }
}

