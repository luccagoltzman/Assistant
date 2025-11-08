import { SpeechService } from './js/services/speech.js';
import { RecognitionService } from './js/services/recognition.js';
import { OpenAIService } from './js/services/openai.js';
import { CommandManager } from './js/commands/index.js';
import { UIService } from './js/services/ui.js';
import { HistoryManager } from './js/utils/history.js';
import { WebSearchService } from './js/services/websearch.js';

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
        this.webSearchService = new WebSearchService();
        this.uiService = new UIService();
        this.commandManager = new CommandManager(this.speechService, this.uiService, this.webSearchService);
        this.isProcessing = false;
        this.config = { OPENAI_API_KEY: apiKey };
        this.speakEnabled = true; // Controle de fala
        this.lastInteractionWasVoice = false; // Rastreia se última interação foi por voz
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
            this.lastInteractionWasVoice = true; // Marca que foi interação por voz
            this.handleCommand(transcript.toLowerCase());
        });

        this.recognitionService.onError((event) => {
            this.uiService.setListening(false);
            this.uiService.updateContent('Erro no reconhecimento de voz. Por favor, tente novamente.');
            
            // Erros de reconhecimento sempre podem falar (são importantes)
            if (event.error === 'not-allowed') {
                if (this.speakEnabled) {
                    this.speechService.speak('Por favor, permita o acesso ao microfone para que eu possa te ouvir.');
                }
            } else {
                if (this.speakEnabled) {
                    this.speechService.speak('Ocorreu um erro ao tentar iniciar o reconhecimento de voz. Tente novamente.');
                }
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

        // Configura campo de texto
        this.setupTextInput();
        
        // Configura toggle de voz
        this.setupVoiceToggle();
    }

    /**
     * Configura o toggle de ativação/desativação da fala
     */
    setupVoiceToggle() {
        const voiceToggle = document.querySelector('#voice-toggle');
        if (!voiceToggle) return;

        // Carrega preferência salva
        const savedPreference = localStorage.getItem('cangalha_speak_enabled');
        if (savedPreference !== null) {
            this.speakEnabled = savedPreference === 'true';
            voiceToggle.checked = this.speakEnabled;
        }

        // Atualiza ícone baseado no estado
        this.updateVoiceToggleIcon();

        // Listener para mudanças
        voiceToggle.addEventListener('change', (e) => {
            this.speakEnabled = e.target.checked;
            localStorage.setItem('cangalha_speak_enabled', this.speakEnabled.toString());
            this.updateVoiceToggleIcon();
        });
    }

    /**
     * Atualiza o ícone do toggle de voz
     */
    updateVoiceToggleIcon() {
        const icon = document.querySelector('.voice-toggle-label i');
        if (icon) {
            icon.className = this.speakEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
        }
    }

    /**
     * Configura o campo de texto para digitação
     */
    setupTextInput() {
        const textInput = document.querySelector('#text-input');
        const sendBtn = document.querySelector('#send-btn');
        const toggleBtn = document.querySelector('#toggle-input-btn');
        const textContainer = document.querySelector('.text-input-container');

        if (!textInput || !sendBtn) return;

        // Função para enviar mensagem
        const sendMessage = () => {
            const message = textInput.value.trim();
            if (message && !this.isProcessing) {
                // Limpa o input
                textInput.value = '';
                
                // Atualiza o conteúdo mostrando a mensagem do usuário
                this.uiService.updateContent(`Você: ${message}`);
                
                // Marca que foi interação por texto (não voz)
                this.lastInteractionWasVoice = false;
                
                // Processa o comando
                this.handleCommand(message);
            }
        };

        // Enviar ao clicar no botão
        sendBtn.addEventListener('click', sendMessage);

        // Enviar ao pressionar Enter
        textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Função para atualizar estado do botão
        const updateSendButton = () => {
            const hasText = textInput.value.trim().length > 0;
            sendBtn.disabled = this.isProcessing || !hasText;
            
            if (this.isProcessing) {
                sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            } else {
                sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
            }
        };

        // Atualiza botão quando o texto muda
        textInput.addEventListener('input', updateSendButton);
        
        // Salva referência para atualizar o botão
        this.updateSendButton = updateSendButton;
        
        // Inicializa o estado do botão
        updateSendButton();

        // Toggle para mostrar/esconder input (opcional)
        if (toggleBtn && textContainer) {
            let inputVisible = true;
            toggleBtn.addEventListener('click', () => {
                inputVisible = !inputVisible;
                if (inputVisible) {
                    textContainer.style.display = 'block';
                    toggleBtn.querySelector('#toggle-icon').className = 'fas fa-keyboard';
                    toggleBtn.setAttribute('aria-label', 'Ocultar campo de texto');
                } else {
                    textContainer.style.display = 'none';
                    toggleBtn.querySelector('#toggle-icon').className = 'fas fa-comments';
                    toggleBtn.setAttribute('aria-label', 'Mostrar campo de texto');
                }
            });
        }

        // Foca no input quando a página carrega
        setTimeout(() => {
            textInput.focus();
        }, 1000);
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

        // Aguarda um pouco antes de falar (só se fala estiver habilitada)
        if (this.speakEnabled) {
            setTimeout(() => {
                this.speechService.speak("INICIANDO CANGALHA...");
                setTimeout(() => {
                    this.speechService.speak(greeting);
                }, 1000);
            }, 500);
        }
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
            
            // Erros de reconhecimento sempre podem falar (são importantes)
            if (this.speakEnabled) {
                if (error.message === 'Permissão de microfone negada') {
                    this.speechService.speak('Por favor, permita o acesso ao microfone para que eu possa te ouvir.');
                } else {
                    this.speechService.speak('Ocorreu um erro ao tentar iniciar o reconhecimento de voz. Tente novamente.');
                }
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
        
        // Atualiza botão de enviar se existir
        if (this.updateSendButton) {
            this.updateSendButton();
        }

        try {
            // Tenta processar como comando específico
            // Passa informação se deve falar (só se foi interação por voz E toggle ativo)
            const shouldSpeak = this.speakEnabled && this.lastInteractionWasVoice;
            const commandProcessed = await this.commandManager.processCommand(message, shouldSpeak);

            // Se não foi um comando específico, usa a API da OpenAI
            if (!commandProcessed) {
                await this.handleOpenAIQuery(message);
            }
        } catch (error) {
            console.error('Erro ao processar comando:', error);
            // Só fala erro se foi interação por voz e toggle ativo
            if (this.speakEnabled && this.lastInteractionWasVoice) {
                this.speechService.speak('Desculpe, encontrei um problema ao processar sua solicitação. Por favor, tente novamente mais tarde.');
            }
            this.uiService.updateContent('Desculpe, encontrei um problema ao processar sua solicitação. Por favor, tente novamente mais tarde.');
        } finally {
            this.isProcessing = false;
            
            // Atualiza botão de enviar novamente
            if (this.updateSendButton) {
                this.updateSendButton();
            }
        }
    }

    /**
     * Detecta se a query requer informações em tempo real
     * @param {string} message
     * @returns {boolean}
     */
    detectRealTimeQuery(message) {
        const lowerMessage = message.toLowerCase();
        const realTimeKeywords = [
            'agora', 'hoje', 'atual', 'recente', 'último', 'última',
            'f1', 'formula 1', 'formula um', 'interlagos', 'corrida', 'gp', 'grand prix',
            'futebol', 'brasileirão', 'copa', 'jogo', 'partida', 'campeonato',
            'notícia', 'noticias', 'acontecendo', 'agora mesmo',
            'tempo real', 'live', 'ao vivo', 'resultado', 'placar', 'classificação',
            '2024', '2025', 'este ano', 'este mês', 'esta semana', 'neste momento',
            'esporte', 'esportes', 'campeonato', 'liga', 'torneio'
        ];
        
        return realTimeKeywords.some(keyword => lowerMessage.includes(keyword));
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
            // Só fala se foi interação por voz e toggle ativo
            if (this.speakEnabled && this.lastInteractionWasVoice) {
                this.speechService.speak(message).catch(err => {
                    // Ignora erros de fala silenciosamente
                    console.warn('Erro ao falar mensagem:', err);
                });
            }
            this.uiService.updateContent('⚠️ API não configurada\n\nPara usar a API da OpenAI:\n1. Crie o arquivo config.js baseado em config.example.js\n2. Adicione sua chave API da OpenAI\n3. Recarregue a página\n\nConsulte GUIA_CONFIGURACAO.md para mais detalhes.');
            return;
        }

        try {
            // SEMPRE tenta buscar informações atualizadas para queries que parecem precisar
            const needsRealTimeInfo = this.detectRealTimeQuery(message);
            
            let webInfo = null;
            if (needsRealTimeInfo) {
                this.uiService.updateContent('Buscando informações atualizadas na web...');
                
                try {
                    // Busca informações na web - tenta múltiplas fontes
                    if (message.toLowerCase().includes('f1') || message.toLowerCase().includes('formula 1') || message.toLowerCase().includes('formula um') || message.toLowerCase().includes('interlagos') || message.toLowerCase().includes('gp')) {
                        console.log('Buscando informações sobre F1...');
                        webInfo = await this.webSearchService.searchSports('F1', message);
                        // Se não encontrou, tenta busca geral também
                        if (!webInfo) {
                            webInfo = await this.webSearchService.searchWeb(message);
                        }
                    } else if (message.toLowerCase().includes('futebol') || message.toLowerCase().includes('brasileirão') || message.toLowerCase().includes('copa') || message.toLowerCase().includes('campeonato')) {
                        console.log('Buscando informações sobre futebol...');
                        webInfo = await this.webSearchService.searchSports('futebol', message);
                        if (!webInfo) {
                            webInfo = await this.webSearchService.searchWeb(message);
                        }
                    } else {
                        console.log('Buscando informações gerais na web...');
                        webInfo = await this.webSearchService.searchWeb(message);
                    }
                    
                    if (webInfo) {
                        console.log('✅ Informações encontradas:', webInfo.substring(0, 100) + '...');
                    } else {
                        console.log('⚠️ Nenhuma informação encontrada na busca (proxies podem estar bloqueados)');
                        // Mesmo sem informações, ainda tenta melhorar a resposta da IA
                        webInfo = 'BUSCA_NA_WEB_FALHOU';
                    }
                } catch (error) {
                    console.error('❌ Erro ao buscar informações na web:', error);
                    webInfo = 'BUSCA_NA_WEB_FALHOU';
                }
            }

            // Obtém histórico recente para contexto
            const history = HistoryManager.getAll().slice(0, 5).map(entry => [
                { role: 'user', content: entry.user },
                { role: 'assistant', content: entry.assistant }
            ]).flat();

            // Adiciona informações da web ao contexto se disponível
            let enhancedMessage = message;
            if (webInfo && webInfo !== 'BUSCA_NA_WEB_FALHOU') {
                // Instruções mais claras e diretas para a IA usar as informações
                enhancedMessage = `PERGUNTA DO USUÁRIO: ${message}

INFORMAÇÕES ATUALIZADAS ENCONTRADAS NA WEB:
${webInfo}

INSTRUÇÕES IMPORTANTES:
1. USE as informações acima para responder a pergunta do usuário
2. Se as informações estiverem disponíveis, RESPONDA com base nelas
3. Cite as fontes quando possível
4. Se as informações não forem completas, mencione isso mas use o que tem disponível
5. NÃO diga que não tem acesso - você TEM acesso através das informações acima
6. Seja específico e use os dados encontrados na busca`;
            } else if (needsRealTimeInfo) {
                // Se detectou que precisa de info em tempo real mas não encontrou
                enhancedMessage = `PERGUNTA DO USUÁRIO: ${message}

CONTEXTO: Esta pergunta requer informações em tempo real. Tentei buscar na web automaticamente, mas os serviços de busca estão temporariamente indisponíveis (problemas de CORS/proxy).

INSTRUÇÕES IMPORTANTES:
1. NÃO diga simplesmente "não tenho acesso" - seja mais útil
2. Explique que você tentou buscar informações atualizadas mas os serviços estão temporariamente indisponíveis
3. Sugira ao usuário usar o comando "pesquisar no google [termo]" para abrir o Google diretamente
4. Mencione fontes confiáveis onde ele pode verificar: sites oficiais, redes sociais oficiais, aplicativos especializados
5. Se você tiver conhecimento geral sobre o tópico (mesmo que não seja atualizado), pode mencionar, mas deixe claro que são informações gerais e podem estar desatualizadas
6. Seja proativo e ofereça alternativas práticas
7. Use um tom útil e prestativo, não apenas dizer que não pode ajudar`;
            }

            this.uiService.updateContent('Pensando...');
            
            const reply = await this.openAIService.sendMessage(enhancedMessage, history);
            
            // Mostra resposta rica formatada
            this.uiService.showRichResponse(reply);
            
            // Também atualiza o conteúdo simples (para compatibilidade)
            this.uiService.updateContent(reply.substring(0, 100) + (reply.length > 100 ? '...' : ''));
            
            // Fala a resposta APENAS se:
            // 1. A fala estiver habilitada (toggle ativo)
            // 2. A última interação foi por voz (não por texto)
            if (this.speakEnabled && this.lastInteractionWasVoice) {
                await this.speechService.speak(reply);
            }
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
            
            // Fala a mensagem de erro apenas se foi interação por voz e toggle ativo
            if (this.speakEnabled && this.lastInteractionWasVoice) {
                this.speechService.speak(speechMessage).catch(err => {
                    // Ignora erros ao falar a mensagem de erro
                    console.warn('Erro ao falar mensagem de erro:', err);
                });
            }
        }
    }
}

// Inicializa a aplicação quando a página carregar
window.addEventListener('load', async () => {
    const loadedConfig = await loadConfig();
    new CangalhaApp(loadedConfig.OPENAI_API_KEY);
});
