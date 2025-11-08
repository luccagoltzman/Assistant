import { StorageManager } from '../utils/storage.js';
import { STORAGE_KEYS } from '../config/constants.js';

/**
 * Serviço de interface do usuário
 */
export class UIService {
    constructor() {
        this.talkContainer = document.querySelector('.talk.input');
        this.content = document.querySelector('.content');
        this.micBtn = document.querySelector('.mic-btn');
        this.timerInterval = null;
        this.timerStartTime = null;
        this.init();
    }

    init() {
        // Carrega tema salvo
        const savedTheme = StorageManager.get(STORAGE_KEYS.THEME, 'light');
        this.setTheme(savedTheme);
    }

    /**
     * Atualiza o conteúdo exibido
     * @param {string} text
     */
    updateContent(text) {
        if (this.content) {
            this.content.textContent = text;
        }
    }

    /**
     * Define o estado de escuta
     * @param {boolean} listening
     */
    setListening(listening) {
        if (this.talkContainer) {
            if (listening) {
                this.talkContainer.classList.add('listening');
                this.updateContent('Estou escutando...');
            } else {
                this.talkContainer.classList.remove('listening');
                this.updateContent('Clique para falar');
            }
        }
    }

    /**
     * Define o tema
     * @param {string} theme - 'dark' ou 'light'
     */
    setTheme(theme) {
        const isDark = theme === 'dark';
        
        // Aplica classe no body para CSS
        if (isDark) {
            document.body.classList.add('dark-mode');
            document.querySelector('.main')?.classList.add('dark');
        } else {
            document.body.classList.remove('dark-mode');
            document.querySelector('.main')?.classList.remove('dark');
        }

        // Salva o tema
        StorageManager.save(STORAGE_KEYS.THEME, theme);
    }

    /**
     * Inicia o cronômetro
     */
    startTimer() {
        this.stopTimer();
        
        this.timerStartTime = Date.now();
        let timeSpan = this.micBtn?.querySelector('.timer');
        
        if (!timeSpan && this.micBtn) {
            timeSpan = document.createElement('span');
            timeSpan.className = 'timer';
            this.micBtn.appendChild(timeSpan);
        }
        
        this.timerInterval = setInterval(() => {
            if (!timeSpan) return;
            
            const elapsed = Math.floor((Date.now() - this.timerStartTime) / 1000);
            const hours = Math.floor(elapsed / 3600);
            const minutes = Math.floor((elapsed % 3600) / 60);
            const seconds = elapsed % 60;
            
            const formatarTempo = (valor) => valor.toString().padStart(2, '0');
            const tempoFormatado = `${formatarTempo(hours)}:${formatarTempo(minutes)}:${formatarTempo(seconds)}`;
            
            timeSpan.textContent = tempoFormatado;
        }, 1000);
    }

    /**
     * Para o cronômetro
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        const timeSpan = this.micBtn?.querySelector('.timer');
        if (timeSpan) {
            timeSpan.remove();
        }
        
        this.timerStartTime = null;
    }

    /**
     * Mostra uma notificação
     * @param {string} title
     * @param {string} body
     */
    showNotification(title, body) {
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(title, { body });
        }
    }

    /**
     * Solicita permissão para notificações
     */
    async requestNotificationPermission() {
        if ("Notification" in window && Notification.permission === "default") {
            await Notification.requestPermission();
        }
    }
}

