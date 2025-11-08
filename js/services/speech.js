import { VOICE_OPTIONS, VOICE_SETTINGS } from '../config/constants.js';

/**
 * Serviço de síntese de voz
 */
export class SpeechService {
    constructor() {
        this.voices = [];
        this.currentUtterance = null;
        this.isSpeaking = false;
        this.initVoices();
    }

    initVoices() {
        if (window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = () => {
                this.voices = window.speechSynthesis.getVoices();
            };
            this.voices = window.speechSynthesis.getVoices();
        }
    }

    /**
     * Para qualquer fala em andamento
     */
    stop() {
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
        if (this.currentUtterance) {
            this.currentUtterance.onend = null;
            this.currentUtterance = null;
        }
        this.isSpeaking = false;
    }

    /**
     * Define a voz para a utterance
     * @param {SpeechSynthesisUtterance} utterance
     */
    setVoice(utterance) {
        let selectedVoice = null;

        for (const voiceName of VOICE_OPTIONS) {
            const voice = this.voices.find(v =>
                v.name.includes(voiceName) ||
                v.lang.includes('pt-BR') ||
                v.lang.includes('pt_BR')
            );
            if (voice) {
                selectedVoice = voice;
                break;
            }
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.pitch = VOICE_SETTINGS.pitch;
            utterance.rate = VOICE_SETTINGS.rate;
            utterance.volume = VOICE_SETTINGS.volume;
        }
    }

    /**
     * Adiciona pausas naturais no texto
     * @param {string} text
     * @returns {string}
     */
    addNaturalPauses(text) {
        text = text.replace(/([.!?]),/g, '$1... ');
        text = text.replace(/([,;:])/g, '$1 ');

        const emphasisWords = ['importante', 'atenção', 'cuidado', 'urgente', 'perigo'];
        emphasisWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            text = text.replace(regex, `... ${word}... `);
        });

        return text;
    }

    /**
     * Fala um texto
     * @param {string} text - Texto a ser falado
     * @param {number} rate - Velocidade da fala (opcional)
     * @returns {Promise<void>}
     */
    speak(text, rate = VOICE_SETTINGS.rate) {
        return new Promise((resolve, reject) => {
            if (!window.speechSynthesis) {
                reject(new Error('Síntese de voz não suportada'));
                return;
            }

            this.stop();

            const utterance = new SpeechSynthesisUtterance(text);
            this.currentUtterance = utterance;

            text = this.addNaturalPauses(text);
            utterance.text = text;
            utterance.rate = rate;

            this.setVoice(utterance);

            utterance.onend = () => {
                this.currentUtterance = null;
                this.isSpeaking = false;
                resolve();
            };

            utterance.onerror = (error) => {
                this.currentUtterance = null;
                this.isSpeaking = false;
                // Trata erros comuns de síntese de voz silenciosamente
                const errorType = error?.error || 'unknown';
                
                // Erros "interrupted" e "canceled" são normais quando a fala é interrompida
                // Não precisam ser logados
                if (errorType === 'interrupted' || errorType === 'canceled') {
                    resolve(); // Resolve silenciosamente para interrupções normais
                } else {
                    // Para outros erros, loga apenas se for um erro real
                    if (errorType !== 'network' && errorType !== 'synthesis-failed') {
                        console.warn('Aviso na síntese de voz:', errorType);
                    } else {
                        console.error('Erro na síntese de voz:', error);
                    }
                    resolve(); // Resolve mesmo assim para não quebrar o fluxo
                }
            };

            this.isSpeaking = true;
            window.speechSynthesis.speak(utterance);
        });
    }

    /**
     * Retorna as vozes disponíveis
     * @returns {Array}
     */
    getVoices() {
        return this.voices;
    }

    /**
     * Retorna vozes em português
     * @returns {Array}
     */
    getPortugueseVoices() {
        return this.voices.filter(v => 
            v.lang.includes('pt') || v.lang.includes('PT')
        );
    }
}

