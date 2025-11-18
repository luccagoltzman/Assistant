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
 * Aplicação principal do Assistent MultiNegócios
 */
class AssistentMultiNegociosApp {
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
        this.isSpeaking = false; // Rastreia se a IA está falando
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
        
        // Configura histórico
        this.setupHistory();
        
        // Configura botão de parar fala
        this.setupStopSpeech();
    }

    /**
     * Configura o toggle de ativação/desativação da fala
     */
    setupVoiceToggle() {
        const voiceToggle = document.querySelector('#voice-toggle');
        if (!voiceToggle) return;

        // Carrega preferência salva
        const savedPreference = localStorage.getItem('assistent_multinegocios_speak_enabled');
        if (savedPreference !== null) {
            this.speakEnabled = savedPreference === 'true';
            voiceToggle.checked = this.speakEnabled;
        }

        // Atualiza ícone baseado no estado
        this.updateVoiceToggleIcon();

        // Listener para mudanças
        voiceToggle.addEventListener('change', (e) => {
            this.speakEnabled = e.target.checked;
            localStorage.setItem('assistent_multinegocios_speak_enabled', this.speakEnabled.toString());
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
     * Configura o histórico de conversas
     */
    setupHistory() {
        const historyBtn = document.querySelector('#history-btn');
        const historySidebar = document.querySelector('#history-sidebar');
        const closeHistoryBtn = document.querySelector('#close-history-btn');
        const clearHistoryBtn = document.querySelector('#clear-history-btn');
        const historyOverlay = document.querySelector('#history-overlay');
        const historyContent = document.querySelector('#history-content');

        if (!historyBtn || !historySidebar) return;

        // Função para abrir/fechar histórico
        const toggleHistory = () => {
            const isOpen = historySidebar.classList.contains('open');
            if (isOpen) {
                closeHistory();
            } else {
                openHistory();
            }
        };

        const openHistory = () => {
            historySidebar.classList.add('open');
            historyOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.renderHistory();
        };

        const closeHistory = () => {
            historySidebar.classList.remove('open');
            historyOverlay.classList.remove('active');
            document.body.style.overflow = '';
        };

        // Event listeners
        historyBtn.addEventListener('click', toggleHistory);
        closeHistoryBtn?.addEventListener('click', closeHistory);
        historyOverlay?.addEventListener('click', closeHistory);

        // Limpar histórico
        clearHistoryBtn?.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja limpar todo o histórico de conversas?')) {
                HistoryManager.clear();
                this.renderHistory();
            }
        });

        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && historySidebar.classList.contains('open')) {
                closeHistory();
            }
        });
    }

    /**
     * Renderiza o histórico de conversas
     */
    renderHistory() {
        const historyContent = document.querySelector('#history-content');
        
        if (!historyContent) return;

        const history = HistoryManager.getAll();

        // Limpa o conteúdo
        historyContent.innerHTML = '';

        if (history.length === 0) {
            // Mostra mensagem vazia
            historyContent.innerHTML = `
                <div class="history-empty">
                    <i class="fas fa-comments"></i>
                    <p>Nenhuma conversa ainda</p>
                    <span>Suas interações com o Assistent MultiNegócios aparecerão aqui</span>
                </div>
            `;
            return;
        }

        // Renderiza cada item do histórico
        history.forEach(entry => {
            const item = this.createHistoryItem(entry);
            historyContent.appendChild(item);
        });
    }

    /**
     * Cria um item de histórico
     * @param {Object} entry - Entrada do histórico
     * @returns {HTMLElement}
     */
    createHistoryItem(entry) {
        const item = document.createElement('div');
        item.className = 'history-item';

        // Formata data e hora
        const date = new Date(entry.timestamp);
        const formattedDate = date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Verifica se o texto da resposta é longo
        const isLongText = entry.assistant.length > 200;
        const truncatedText = isLongText ? entry.assistant.substring(0, 200) + '...' : entry.assistant;

        item.innerHTML = `
            <div class="history-item-header">
                <span class="history-item-time">
                    <i class="fas fa-clock"></i> ${formattedDate}
                </span>
                <button class="history-item-delete" data-id="${entry.id}" aria-label="Excluir conversa">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
            <div class="history-item-user">
                <div class="history-item-user-label">
                    <i class="fas fa-user"></i> Você
                </div>
                <div class="history-item-user-text">${this.escapeHtml(entry.user)}</div>
            </div>
            <div class="history-item-assistant">
                <div class="history-item-assistant-label">
                    <i class="fas fa-robot"></i> Assistent MultiNegócios
                </div>
                <div class="history-item-assistant-text ${isLongText ? '' : 'expanded'}">${this.escapeHtml(truncatedText)}</div>
                ${isLongText ? `
                    <div class="history-item-expand" data-id="${entry.id}">
                        Ver mais <i class="fas fa-chevron-down"></i>
                    </div>
                ` : ''}
            </div>
        `;

        // Event listener para expandir/recolher texto
        const expandBtn = item.querySelector('.history-item-expand');
        if (expandBtn) {
            expandBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const textElement = item.querySelector('.history-item-assistant-text');
                const isExpanded = textElement.classList.contains('expanded');
                
                if (isExpanded) {
                    textElement.classList.remove('expanded');
                    textElement.textContent = truncatedText;
                    expandBtn.innerHTML = 'Ver mais <i class="fas fa-chevron-down"></i>';
                } else {
                    textElement.classList.add('expanded');
                    textElement.textContent = this.escapeHtml(entry.assistant);
                    expandBtn.innerHTML = 'Ver menos <i class="fas fa-chevron-up"></i>';
                }
            });
        }

        // Event listener para deletar item
        const deleteBtn = item.querySelector('.history-item-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Deseja excluir esta conversa do histórico?')) {
                    HistoryManager.remove(entry.id);
                    this.renderHistory();
                }
            });
        }

        // Event listener para clicar no item (pode ser usado para recarregar a conversa)
        item.addEventListener('click', (e) => {
            // Não faz nada se clicou em botões
            if (e.target.closest('button')) return;
            
            // Aqui você pode adicionar funcionalidade para recarregar a conversa
            // Por exemplo, mostrar a resposta completa na área de resposta
            this.uiService.showRichResponse(entry.assistant);
        });

        return item;
    }

    /**
     * Escapa HTML para prevenir XSS
     * @param {string} text
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Configura o botão de parar fala
     */
    setupStopSpeech() {
        const stopSpeechBtn = document.querySelector('#stop-speech-btn');
        
        if (!stopSpeechBtn) return;

        // Event listener para parar a fala
        stopSpeechBtn.addEventListener('click', () => {
            this.stopSpeech();
        });

        // Atalho de teclado: ESC ou Space para parar fala quando estiver falando
        document.addEventListener('keydown', (e) => {
            // Só funciona se a IA estiver falando
            if (!this.isSpeaking) return;
            
            // ESC ou Space para parar
            if (e.key === 'Escape' || (e.key === ' ' && !e.target.matches('input, textarea'))) {
                e.preventDefault();
                this.stopSpeech();
            }
        });

        // Monitora o estado de fala através do SpeechService
        this.monitorSpeechState();
    }

    /**
     * Para a fala da IA
     */
    stopSpeech() {
        this.speechService.stop();
        this.isSpeaking = false;
        this.hideStopSpeechButton();
    }

    /**
     * Mostra o botão de parar fala
     */
    showStopSpeechButton() {
        const stopSpeechBtn = document.querySelector('#stop-speech-btn');
        if (stopSpeechBtn) {
            stopSpeechBtn.style.display = 'flex';
            // Animação de entrada
            setTimeout(() => {
                stopSpeechBtn.classList.add('visible');
            }, 10);
        }
    }

    /**
     * Esconde o botão de parar fala
     */
    hideStopSpeechButton() {
        const stopSpeechBtn = document.querySelector('#stop-speech-btn');
        if (stopSpeechBtn) {
            stopSpeechBtn.classList.remove('visible');
            setTimeout(() => {
                stopSpeechBtn.style.display = 'none';
            }, 300);
        }
    }

    /**
     * Detecta se a resposta da IA foi assertiva ou vaga
     * @param {string} reply - Resposta da IA
     * @returns {boolean} - true se foi assertiva, false se foi vaga
     */
    isResponseAssertive(reply) {
        if (!reply || reply.trim().length < 20) {
            return false;
        }

        const lowerReply = reply.toLowerCase();
        
        // Frases que indicam resposta vaga/não assertiva
        const vaguePhrases = [
            'não há informação direta',
            'não há uma informação direta',
            'não encontrei informações',
            'não tenho acesso',
            'não posso fornecer',
            'não consigo encontrar',
            'informações não estão disponíveis',
            'não foi possível encontrar',
            'recomenda-se verificar',
            'recomendo pesquisar',
            'recomendo que você',
            'sugiro verificar',
            'sugiro que você',
            'é possível observar que',
            'com base nas informações recentes encontradas, não há',
            'não há uma informação específica',
            'informações podem estar',
            'tente verificar',
            'consulte',
            'verifique a previsão',
            'pesquisar em sites',
            'pesquisar em',
            'entrar em contato',
            'obter informações'
        ];
        
        // Verifica se contém frases vagas
        const hasVaguePhrase = vaguePhrases.some(phrase => lowerReply.includes(phrase));
        
        // Verifica se tem dados específicos (números, porcentagens, etc)
        const hasSpecificData = /\d+%|\d+°c|\d+°c|\d+\s*(km\/h|kmh|graus|porcento)/i.test(reply);
        
        // Se tem frase vaga E não tem dados específicos, não é assertiva
        if (hasVaguePhrase && !hasSpecificData) {
            return false;
        }
        
        // Se tem dados específicos, provavelmente é assertiva
        if (hasSpecificData) {
            return true;
        }
        
        // Se não tem frase vaga, provavelmente é assertiva
        return !hasVaguePhrase;
    }

    /**
     * Abre o Google com a pesquisa
     * @param {string} query - Termo de busca
     */
    openGoogleSearch(query) {
        try {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            console.log('🔍 Tentando abrir Google com pesquisa:', query);
            
            // Tenta abrir em nova aba
            const newWindow = window.open(searchUrl, '_blank', 'noopener,noreferrer');
            
            // Verifica se o pop-up foi bloqueado
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                console.warn('⚠️ Pop-up bloqueado pelo navegador. Tentando método alternativo...');
                // Método alternativo: criar link e clicar programaticamente
                const link = document.createElement('a');
                link.href = searchUrl;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                console.log('✅ Link alternativo criado e clicado');
            } else {
                console.log('✅ Google aberto com sucesso');
            }
            
            // Notifica o usuário
            if (this.speakEnabled && this.lastInteractionWasVoice) {
                this.speechService.speak('Abri o Google com a pesquisa para você encontrar informações mais precisas.');
            }
            
            // Adiciona notificação visual na resposta
            const responseContent = document.querySelector('#response-content');
            if (responseContent) {
                const notification = document.createElement('div');
                notification.style.cssText = 'margin-top: 15px; padding: 12px; background: rgba(0, 188, 212, 0.1); border-left: 4px solid var(--primary-color); border-radius: 4px;';
                notification.innerHTML = '<strong>🔍 Google aberto:</strong> Abri uma nova aba com sua pesquisa para informações mais precisas.';
                responseContent.appendChild(notification);
            }
        } catch (error) {
            console.error('❌ Erro ao abrir Google:', error);
            // Fallback: mostra link clicável
            const responseContent = document.querySelector('#response-content');
            if (responseContent) {
                const notification = document.createElement('div');
                notification.style.cssText = 'margin-top: 15px; padding: 12px; background: rgba(220, 53, 69, 0.1); border-left: 4px solid var(--accent-color); border-radius: 4px;';
                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                notification.innerHTML = `<strong>🔍 Pop-up bloqueado:</strong> <a href="${searchUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: underline;">Clique aqui para pesquisar no Google</a>`;
                responseContent.appendChild(notification);
            }
        }
    }

    /**
     * Monitora o estado de fala
     */
    monitorSpeechState() {
        // Verifica periodicamente se está falando
        setInterval(() => {
            const isCurrentlySpeaking = window.speechSynthesis?.speaking || false;
            
            if (isCurrentlySpeaking && !this.isSpeaking) {
                // Começou a falar
                this.isSpeaking = true;
                this.showStopSpeechButton();
            } else if (!isCurrentlySpeaking && this.isSpeaking) {
                // Parou de falar
                this.isSpeaking = false;
                this.hideStopSpeechButton();
            }
        }, 100); // Verifica a cada 100ms
    }

    /**
     * Saudação inicial
     */
    wishMe() {
        const day = new Date();
        const hour = day.getHours();

        let greeting;
        if (hour >= 0 && hour < 12) {
            greeting = "Bom dia...";
        } else if (hour >= 12 && hour < 17) {
            greeting = "Boa tarde...";
        } else {
            greeting = "Boa noite...";
        }

        // Aguarda um pouco antes de falar (só se fala estiver habilitada)
        if (this.speakEnabled) {
            setTimeout(() => {
                this.speechService.speak("INICIANDO ASSISTENT MULTINEGÓCIOS...");
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
            'esporte', 'esportes', 'campeonato', 'liga', 'torneio',
            // Clima e tempo
            'chuva', 'chover', 'chovendo', 'previsão', 'tempo', 'clima', 'temperatura',
            'probabilidade', 'vai chover', 'vai chover hoje', 'previsão do tempo',
            'clima hoje', 'tempo hoje', 'chuva hoje', 'previsão hoje'
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
                    const lowerMessage = message.toLowerCase();
                    // Busca informações na web - tenta múltiplas fontes
                    if (lowerMessage.includes('f1') || lowerMessage.includes('formula 1') || lowerMessage.includes('formula um') || lowerMessage.includes('interlagos') || lowerMessage.includes('gp')) {
                        console.log('Buscando informações sobre F1...');
                        webInfo = await this.webSearchService.searchSports('F1', message);
                        // Se não encontrou, tenta busca geral também
                        if (!webInfo) {
                            webInfo = await this.webSearchService.searchWeb(message);
                        }
                    } else if (lowerMessage.includes('futebol') || lowerMessage.includes('brasileirão') || lowerMessage.includes('copa') || lowerMessage.includes('campeonato')) {
                        console.log('Buscando informações sobre futebol...');
                        webInfo = await this.webSearchService.searchSports('futebol', message);
                        if (!webInfo) {
                            webInfo = await this.webSearchService.searchWeb(message);
                        }
                    } else if (lowerMessage.includes('chuva') || lowerMessage.includes('chover') || lowerMessage.includes('clima') || lowerMessage.includes('tempo') || lowerMessage.includes('previsão')) {
                        console.log('Buscando informações sobre clima/tempo...');
                        // Usa função específica para busca de clima
                        webInfo = await this.webSearchService.searchWeather(message);
                        // Se não encontrou, tenta busca geral também
                        if (!webInfo || webInfo.trim().length < 50) {
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
                // Instruções MUITO assertivas e diretas para a IA usar as informações
                enhancedMessage = `PERGUNTA DO USUÁRIO: ${message}

INFORMAÇÕES ATUALIZADAS ENCONTRADAS NA WEB:
${webInfo}

INSTRUÇÕES CRÍTICAS - LEIA COM ATENÇÃO:
1. VOCÊ TEM ACESSO DIRETO ÀS INFORMAÇÕES ACIMA - USE-AS AGORA
2. SEJA DIRETO E ASSERTIVO - NÃO diga "não há informação direta" ou "não tenho acesso"
3. EXTRAIA os dados específicos das informações acima e apresente-os de forma clara
4. Se encontrar porcentagens, temperaturas, horários, ou dados numéricos, APRESENTE-OS DIRETAMENTE
5. NÃO seja vago - seja ESPECÍFICO com os dados encontrados
6. Se a pergunta é sobre probabilidade de chuva, responda com a porcentagem encontrada
7. Se a pergunta é sobre temperatura, responda com a temperatura encontrada
8. Cite as fontes apenas no final, mas PRIMEIRO dê a resposta direta
9. Sua resposta DEVE começar com a informação principal que o usuário pediu
10. NÃO use frases como "com base nas informações" ou "não há informação direta" - SEJA DIRETO

EXEMPLO DE RESPOSTA CORRETA:
"Hoje em São Luís há 25% de probabilidade de chuva. A temperatura está em 29°C, com umidade de 72% e vento de 26 km/h. O clima está predominantemente nublado."

EXEMPLO DE RESPOSTA INCORRETA (NÃO FAÇA ISSO):
"Com base nas informações recentes encontradas, não há uma informação direta sobre a probabilidade de chuva hoje em São Luís..."

RESPONDA AGORA DE FORMA DIRETA E ASSERTIVA:`;
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
            
            // Verifica se a resposta foi assertiva
            const isAssertive = this.isResponseAssertive(reply);
            
            // Mostra resposta rica formatada
            this.uiService.showRichResponse(reply);
            
            // Se não foi assertiva, abre o Google (independente de ser tempo real ou não)
            // Isso ajuda quando a IA não consegue responder adequadamente
            if (!isAssertive) {
                console.log('⚠️ Resposta não foi assertiva, abrindo Google com a pesquisa...');
                console.log('📊 Detalhes:', { isAssertive, needsRealTimeInfo, message });
                // Aguarda um pouco para não ser muito intrusivo
                setTimeout(() => {
                    this.openGoogleSearch(message);
                }, 1500);
            }
            
            // Também atualiza o conteúdo simples (para compatibilidade)
            this.uiService.updateContent(reply.substring(0, 100) + (reply.length > 100 ? '...' : ''));
            
            // Atualiza o histórico se estiver aberto (o histórico já é salvo no openai.js)
            if (document.querySelector('#history-sidebar')?.classList.contains('open')) {
                this.renderHistory();
            }
            
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
    new AssistentMultiNegociosApp(loadedConfig.OPENAI_API_KEY);
});
