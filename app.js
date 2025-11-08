import { SpeechService } from './js/services/speech.js';
import { RecognitionService } from './js/services/recognition.js';
import { OpenAIService } from './js/services/openai.js';
import { CommandManager } from './js/commands/index.js';
import { UIService } from './js/services/ui.js';
import { HistoryManager } from './js/utils/history.js';

// Carrega configuração com fallback
let config = { OPENAI_API_KEY: "YOUR_API_KEY_HERE" };

/**
 * Carrega a configuração
 */
async function loadConfig() {
    try {
        const configModule = await import('./config.js');
        config = configModule.default || configModule;
        
        // Verifica se a chave API foi configurada
        if (config.OPENAI_API_KEY && config.OPENAI_API_KEY !== "YOUR_API_KEY_HERE") {
            console.log('✅ Configuração carregada com sucesso!');
        } else {
            // Mostra mensagem amigável se a chave não está configurada
            console.info('ℹ️ Para usar a API da OpenAI, configure sua chave API no arquivo config.js');
            console.info('📝 Edite config.js e substitua "YOUR_API_KEY_HERE" pela sua chave API');
            console.info('🔗 Obtenha sua chave em: https://platform.openai.com/api-keys');
        }
    } catch (error) {
        // Se houver erro ao carregar (improvável agora que o arquivo existe)
        console.error('Erro ao carregar config.js:', error);
        // Usa configuração padrão
        config = { OPENAI_API_KEY: "YOUR_API_KEY_HERE" };
    }
    return config;
}

/**
 * Aplicação principal do CANGALHA
 */
class CangalhaApp {
    constructor(apiKey) {
        this.speechService = new SpeechService();
        this.recognitionService = new RecognitionService();
        this.openAIService = new OpenAIService(apiKey || "YOUR_API_KEY_HERE");
        this.uiService = new UIService();
        this.commandManager = new CommandManager(this.speechService, this.uiService);
        this.isProcessing = false;
        this.config = { OPENAI_API_KEY: apiKey };
        this.init();
    }

    /**
     * Inicializa a aplicação
     */
    init() {
        this.setupRecognition();
        this.setupUI();
        this.setupVoices();
        this.setupNotifications();
        this.wishMe();
    }

    /**
     * Configura o reconhecimento de voz
     */
    setupRecognition() {
        if (!this.recognitionService.isAvailable()) {
            this.uiService.updateContent('Seu navegador não suporta reconhecimento de voz. Por favor, use o Google Chrome.');
            return;
        }

        this.recognitionService.onStart(() => {
            this.uiService.setListening(true);
        });

        this.recognitionService.onEnd(() => {
            this.uiService.setListening(false);
        });

        this.recognitionService.onResult((transcript) => {
            this.uiService.updateContent(transcript);
            this.handleCommand(transcript.toLowerCase());
        });

        this.recognitionService.onError((event) => {
            this.uiService.setListening(false);
            this.uiService.updateContent('Erro no reconhecimento de voz. Por favor, tente novamente.');
            
            if (event.error === 'not-allowed') {
                this.speechService.speak('Por favor, permita o acesso ao microfone para que eu possa te ouvir.');
            } else {
                this.speechService.speak('Ocorreu um erro ao tentar iniciar o reconhecimento de voz. Tente novamente.');
            }
        });
    }

    /**
     * Configura a interface do usuário
     */
    setupUI() {
        const talkContainer = document.querySelector('.talk.input');
        
        if (talkContainer) {
            talkContainer.addEventListener('mousedown', () => {
                this.speechService.stop();
            });

            talkContainer.addEventListener('click', () => {
                this.startRecognition();
            });
        }
    }

    /**
     * Configura as vozes
     */
    setupVoices() {
        if (window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = () => {
                if (this.speechService.getVoices().length === 0) {
                    this.speechService.initVoices();
                }
            };
            
            if (this.speechService.getVoices().length === 0) {
                this.speechService.initVoices();
            }
        }
    }

    /**
     * Configura notificações
     */
    setupNotifications() {
        if ("Notification" in window) {
            // Só solicita permissão se ainda não foi definida
            // Evita solicitar se o usuário já bloqueou
            if (Notification.permission === "default") {
                Notification.requestPermission().catch(err => {
                    console.warn('Erro ao solicitar permissão de notificação:', err);
                });
            }
        }
    }

    /**
     * Saudação inicial
     */
    wishMe() {
        const day = new Date();
        const hour = day.getHours();

        let greeting;
        if (hour >= 0 && hour < 12) {
            greeting = "Bom dia moço...";
        } else if (hour >= 12 && hour < 17) {
            greeting = "Boa tarde moço...";
        } else {
            greeting = "Boa noite moço...";
        }

        // Aguarda um pouco antes de falar
        setTimeout(() => {
            this.speechService.speak("INICIANDO CANGALHA...");
            setTimeout(() => {
                this.speechService.speak(greeting);
            }, 1000);
        }, 500);
    }

    /**
     * Inicia o reconhecimento de voz
     */
    async startRecognition() {
        if (this.isProcessing) {
            return;
        }

        try {
            this.speechService.stop();
            await this.recognitionService.start();
        } catch (error) {
            console.error('Erro ao iniciar reconhecimento:', error);
            
            if (error.message === 'Permissão de microfone negada') {
                this.speechService.speak('Por favor, permita o acesso ao microfone para que eu possa te ouvir.');
            } else {
                this.speechService.speak('Ocorreu um erro ao tentar iniciar o reconhecimento de voz. Tente novamente.');
            }
            
            this.uiService.setListening(false);
        }
    }

    /**
     * Processa um comando
     * @param {string} message
     */
    async handleCommand(message) {
        if (this.isProcessing) {
            return;
        }

        this.isProcessing = true;

        try {
            // Tenta processar como comando específico
            const commandProcessed = await this.commandManager.processCommand(message);

            // Se não foi um comando específico, usa a API da OpenAI
            if (!commandProcessed) {
                await this.handleOpenAIQuery(message);
            }
        } catch (error) {
            console.error('Erro ao processar comando:', error);
            this.speechService.speak('Desculpe, encontrei um problema ao processar sua solicitação. Por favor, tente novamente mais tarde.');
            this.uiService.updateContent('Desculpe, encontrei um problema ao processar sua solicitação. Por favor, tente novamente mais tarde.');
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Processa uma consulta usando a API da OpenAI
     * @param {string} message
     */
    async handleOpenAIQuery(message) {
        // Verifica se a chave API está disponível
        const apiKey = this.config?.OPENAI_API_KEY || "YOUR_API_KEY_HERE";
        if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
            const message = 'Desculpe, não posso responder perguntas gerais no momento pois não estou conectado à API da OpenAI. Por favor, use os comandos específicos como "que horas são", "abrir youtube", entre outros. Para configurar a API, consulte o arquivo GUIA_CONFIGURACAO.md';
            this.speechService.speak(message).catch(err => {
                // Ignora erros de fala silenciosamente
                console.warn('Erro ao falar mensagem:', err);
            });
            this.uiService.updateContent('⚠️ API não configurada\n\nPara usar a API da OpenAI:\n1. Crie o arquivo config.js baseado em config.example.js\n2. Adicione sua chave API da OpenAI\n3. Recarregue a página\n\nConsulte GUIA_CONFIGURACAO.md para mais detalhes.');
            return;
        }

        try {
            // Obtém histórico recente para contexto
            const history = HistoryManager.getAll().slice(0, 5).map(entry => [
                { role: 'user', content: entry.user },
                { role: 'assistant', content: entry.assistant }
            ]).flat();

            this.uiService.updateContent('Pensando...');
            
            const reply = await this.openAIService.sendMessage(message, history);
            
            await this.speechService.speak(reply);
            this.uiService.updateContent(reply);
        } catch (error) {
            console.error('Erro na API:', error);
            
            // Tratamento específico para diferentes tipos de erro
            let errorMessage = '';
            let speechMessage = '';
            
            if (error.status === 429) {
                // Erro 429: Too Many Requests ou Quota Exceeded
                if (error.message.includes('quota') || error.message.includes('Quota')) {
                    errorMessage = '⚠️ Cota da API Excedida\n\n' +
                        'Você excedeu sua cota atual da OpenAI.\n\n' +
                        '📋 Como resolver:\n' +
                        '1. Acesse: https://platform.openai.com/account/billing\n' +
                        '2. Verifique seu plano e adicione créditos\n' +
                        '3. Ou aguarde o reset da cota\n\n' +
                        '💡 Enquanto isso, você pode usar comandos específicos:\n' +
                        '• "que horas são"\n' +
                        '• "abrir youtube"\n' +
                        '• "calcular 2 + 2"\n' +
                        '• E muitos outros!';
                    
                    speechMessage = 'Desculpe, a cota da API foi excedida. Por favor, verifique seu plano e adicione créditos na plataforma da OpenAI. Enquanto isso, você pode usar os comandos específicos.';
                } else {
                    errorMessage = '⚠️ Muitas Requisições\n\n' +
                        'Você fez muitas requisições em pouco tempo.\n\n' +
                        '⏳ Aguarde alguns segundos e tente novamente.\n\n' +
                        '💡 Use comandos específicos enquanto aguarda.';
                    
                    speechMessage = 'Muitas requisições. Aguarde alguns segundos e tente novamente.';
                }
            } else if (error.status === 401) {
                errorMessage = '⚠️ Chave API Inválida\n\n' +
                    'Sua chave API não é válida ou expirou.\n\n' +
                    '📋 Como resolver:\n' +
                    '1. Verifique sua chave API em: https://platform.openai.com/api-keys\n' +
                    '2. Atualize o arquivo config.js com uma chave válida\n' +
                    '3. Recarregue a página';
                
                speechMessage = 'Chave API inválida. Verifique sua configuração.';
            } else if (error.status === 500 || error.status >= 500) {
                errorMessage = '⚠️ Erro no Servidor\n\n' +
                    'Houve um problema no servidor da OpenAI.\n\n' +
                    '⏳ Tente novamente em alguns instantes.\n\n' +
                    '💡 Use comandos específicos enquanto aguarda.';
                
                speechMessage = 'Erro no servidor. Tente novamente em alguns instantes.';
            } else {
                // Erro genérico
                errorMessage = '⚠️ Erro na API\n\n' +
                    'Não foi possível processar sua solicitação.\n\n' +
                    '💡 Use comandos específicos:\n' +
                    '• "que horas são"\n' +
                    '• "abrir youtube"\n' +
                    '• "calcular 2 + 2"\n' +
                    '• "contar piada"\n' +
                    '• E muitos outros!';
                
                speechMessage = 'Desculpe, não posso responder perguntas gerais no momento. Por favor, use os comandos específicos.';
            }
            
            // Mostra mensagem de erro amigável
            this.uiService.updateContent(errorMessage);
            
            // Fala a mensagem de erro
            this.speechService.speak(speechMessage).catch(err => {
                // Ignora erros ao falar a mensagem de erro
                console.warn('Erro ao falar mensagem de erro:', err);
            });
        }
    }
}

// Inicializa a aplicação quando a página carregar
window.addEventListener('load', async () => {
    const loadedConfig = await loadConfig();
    new CangalhaApp(loadedConfig.OPENAI_API_KEY);
});
