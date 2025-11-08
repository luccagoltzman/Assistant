/**
 * Serviço de reconhecimento de voz
 */
export class RecognitionService {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.init();
    }

    init() {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                throw new Error('Reconhecimento de voz não suportado');
            }

            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'pt-BR';
            this.recognition.continuous = false;
            this.recognition.interimResults = false;

            this.setupEventHandlers();
        } catch (error) {
            console.error('Erro ao inicializar reconhecimento de voz:', error);
        }
    }

    setupEventHandlers() {
        if (!this.recognition) return;

        this.recognition.onstart = () => {
            this.isListening = true;
            if (this.onStartCallback) {
                this.onStartCallback();
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            if (this.onEndCallback) {
                this.onEndCallback();
            }
        };

        this.recognition.onresult = (event) => {
            const currentIndex = event.resultIndex;
            const transcript = event.results[currentIndex][0].transcript;
            if (this.onResultCallback) {
                this.onResultCallback(transcript);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Erro no reconhecimento de voz:', event.error);
            this.isListening = false;
            if (this.onErrorCallback) {
                this.onErrorCallback(event);
            }
        };
    }

    /**
     * Inicia o reconhecimento de voz
     * @returns {Promise<void>}
     */
    async start() {
        if (!this.recognition) {
            throw new Error('Reconhecimento de voz não disponível');
        }

        if (this.isListening) {
            this.stop();
        }

        try {
            await this.recognition.start();
        } catch (error) {
            if (error.name === 'NotAllowedError') {
                throw new Error('Permissão de microfone negada');
            } else if (error.name === 'AbortError') {
                // Ignora erros de abort
                return;
            } else {
                throw error;
            }
        }
    }

    /**
     * Para o reconhecimento de voz
     */
    stop() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.abort();
            } catch (error) {
                console.error('Erro ao parar reconhecimento:', error);
            }
        }
        this.isListening = false;
    }

    /**
     * Define callback para quando o reconhecimento iniciar
     * @param {Function} callback
     */
    onStart(callback) {
        this.onStartCallback = callback;
    }

    /**
     * Define callback para quando o reconhecimento terminar
     * @param {Function} callback
     */
    onEnd(callback) {
        this.onEndCallback = callback;
    }

    /**
     * Define callback para quando houver resultado
     * @param {Function} callback
     */
    onResult(callback) {
        this.onResultCallback = callback;
    }

    /**
     * Define callback para quando houver erro
     * @param {Function} callback
     */
    onError(callback) {
        this.onErrorCallback = callback;
    }

    /**
     * Verifica se o reconhecimento está disponível
     * @returns {boolean}
     */
    isAvailable() {
        return this.recognition !== null;
    }
}

