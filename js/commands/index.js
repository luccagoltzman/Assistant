import { COMMANDS } from '../config/constants.js';
import { detectOS } from '../utils/os.js';
import { HistoryManager } from '../utils/history.js';

/**
 * Gerenciador de comandos
 */
export class CommandManager {
    constructor(speechService, uiService, webSearchService = null, cameraService = null, openAIService = null) {
        this.speechService = speechService;
        this.uiService = uiService;
        this.webSearchService = webSearchService;
        this.cameraService = cameraService;
        this.openAIService = openAIService;
        this.shouldSpeak = true; // Controle de fala
    }

    /**
     * Helper para falar apenas se shouldSpeak for true
     * @param {string} text - Texto a ser falado
     */
    async speakIfEnabled(text) {
        if (this.shouldSpeak) {
            await this.speechService.speak(text);
        }
    }

    /**
     * Processa um comando
     * @param {string} message - Mensagem do usuário
     * @param {boolean} shouldSpeak - Se deve falar a resposta (padrão: true)
     * @returns {Promise<boolean>} - Retorna true se o comando foi processado
     */
    async processCommand(message, shouldSpeak = true) {
        this.shouldSpeak = shouldSpeak; // Armazena o estado
        const lowerMessage = message.toLowerCase().trim();

        // Ajuda
        if (this.matches(lowerMessage, COMMANDS.HELP)) {
            await this.handleHelp();
            return true;
        }

        // Navegação
        if (this.matches(lowerMessage, COMMANDS.OPEN_YOUTUBE)) {
            await this.handleOpenURL('https://www.youtube.com', 'Abrindo YouTube');
            return true;
        }

        if (this.matches(lowerMessage, COMMANDS.OPEN_GOOGLE)) {
            await this.handleOpenURL('https://www.google.com', 'Abrindo Google');
            return true;
        }

        if (this.matches(lowerMessage, COMMANDS.OPEN_LINKEDIN)) {
            await this.handleOpenURL('https://www.linkedin.com', 'Abrindo LinkedIn');
            return true;
        }

        if (this.matches(lowerMessage, COMMANDS.OPEN_FACEBOOK)) {
            await this.handleOpenURL('https://www.facebook.com', 'Abrindo Facebook');
            return true;
        }

        if (this.matches(lowerMessage, COMMANDS.OPEN_INSTAGRAM)) {
            await this.handleOpenURL('https://www.instagram.com', 'Abrindo Instagram');
            return true;
        }

        if (this.matches(lowerMessage, COMMANDS.OPEN_TWITTER)) {
            await this.handleOpenURL('https://www.twitter.com', 'Abrindo Twitter');
            return true;
        }

        // Pesquisas
        if (lowerMessage.includes('pesquisar no google') || lowerMessage.includes('pesquisar google')) {
            const termo = message.replace(/pesquisar no google|pesquisar google/gi, '').trim();
            if (termo) {
                await this.handleSearch('google', termo);
                return true;
            }
        }

        if (lowerMessage.includes('pesquisar na wikipedia') || lowerMessage.includes('wikipedia')) {
            const termo = message.replace(/pesquisar na wikipedia|wikipedia/gi, '').trim();
            if (termo) {
                await this.handleSearch('wikipedia', termo);
                return true;
            }
        }

        // Data e hora
        if (this.matches(lowerMessage, COMMANDS.TIME)) {
            await this.handleTime();
            return true;
        }

        if (this.matches(lowerMessage, COMMANDS.DATE)) {
            await this.handleDate();
            return true;
        }

        // Música e entretenimento
        if (this.matches(lowerMessage, COMMANDS.MUSIC)) {
            await this.handleOpenURL('https://music.youtube.com', 'Tocando sua playlist favorita no YouTube Music');
            return true;
        }

        if (this.matches(lowerMessage, COMMANDS.WEATHER)) {
            await this.handleOpenURL('https://weather.com/pt-BR/clima/hoje/l/-23.55,-46.64', 'Abrindo previsão do tempo');
            return true;
        }

        if (this.matches(lowerMessage, COMMANDS.JOKE)) {
            await this.handleJoke();
            return true;
        }

        // Temas
        if (this.matches(lowerMessage, COMMANDS.DARK_MODE)) {
            await this.handleTheme('dark');
            return true;
        }

        if (this.matches(lowerMessage, COMMANDS.LIGHT_MODE)) {
            await this.handleTheme('light');
            return true;
        }

        // Cálculos
        if (lowerMessage.includes('calcular') || lowerMessage.includes('calcule')) {
            await this.handleCalculate(message);
            return true;
        }

        // Cronômetro
        if (this.matches(lowerMessage, COMMANDS.TIMER)) {
            await this.handleTimer();
            return true;
        }

        // Tradução
        if (lowerMessage.includes('traduzir') || lowerMessage.includes('traduza')) {
            const texto = message.replace(/traduzir|traduza/gi, '').trim();
            if (texto) {
                await this.handleTranslate(texto);
                return true;
            }
        }

        // Lembretes
        if (lowerMessage.includes('criar lembrete') || lowerMessage.includes('lembrete')) {
            const lembrete = message.replace(/criar lembrete|lembrete/gi, '').trim();
            if (lembrete) {
                await this.handleReminder(lembrete);
                return true;
            }
        }

        // Volume
        if (this.matches(lowerMessage, COMMANDS.VOLUME_UP)) {
            await this.speakIfEnabled('Volume aumentado');
            return true;
        }

        if (this.matches(lowerMessage, COMMANDS.VOLUME_DOWN)) {
            await this.speakIfEnabled('Volume diminuído');
            return true;
        }

        // Vozes
        if (this.matches(lowerMessage, COMMANDS.LIST_VOICES)) {
            await this.handleListVoices();
            return true;
        }

        if (this.matches(lowerMessage, COMMANDS.CHANGE_VOICE)) {
            await this.handleChangeVoice();
            return true;
        }

        // Aplicativos
        if (this.matches(lowerMessage, COMMANDS.CALCULATOR)) {
            await this.handleOpenApp('calculator');
            return true;
        }

        if (lowerMessage.includes('abrir bloco de notas') || lowerMessage.includes('bloco de notas')) {
            await this.handleOpenApp('notepad');
            return true;
        }

        if (this.matches(lowerMessage, COMMANDS.CAMERA)) {
            await this.handleCamera();
            return true;
        }

        if (this.matches(lowerMessage, COMMANDS.READ_DOCUMENT)) {
            await this.handleReadDocument();
            return true;
        }

        if (this.matches(lowerMessage, COMMANDS.SETTINGS)) {
            await this.handleOpenApp('settings');
            return true;
        }

        // Histórico
        if (lowerMessage.includes('histórico') || lowerMessage.includes('historia')) {
            await this.handleHistory();
            return true;
        }

        if (lowerMessage.includes('limpar histórico')) {
            HistoryManager.clear();
            await this.speakIfEnabled('Histórico limpo');
            this.uiService.updateContent('Histórico limpo com sucesso');
            return true;
        }

        // Busca na web
        if (lowerMessage.includes('buscar na web') || lowerMessage.includes('pesquisar na web') || lowerMessage.includes('buscar informações')) {
            const query = message.replace(/buscar na web|pesquisar na web|buscar informações/gi, '').trim();
            if (query && this.webSearchService) {
                await this.handleWebSearch(query);
                return true;
            } else if (!this.webSearchService) {
                await this.speakIfEnabled('Serviço de busca na web não disponível');
                this.uiService.updateContent('Serviço de busca na web não disponível');
                return true;
            }
        }

        return false;
    }

    /**
     * Verifica se a mensagem corresponde a algum comando
     * @param {string} message
     * @param {Array} commands
     * @returns {boolean}
     */
    matches(message, commands) {
        // Verifica se algum comando corresponde à mensagem
        // Usa verificação exata ou de frase completa para evitar falsos positivos
        return commands.some(cmd => {
            // Se o comando é uma frase completa (tem mais de uma palavra), verifica se está contida
            if (cmd.split(' ').length > 1) {
                return message.includes(cmd);
            }
            // Se é uma palavra única, verifica se é exata ou está no início/fim de frase
            // Isso evita que palavras genéricas como "dia", "tempo" acionem comandos
            const words = message.split(/\s+/);
            return words.includes(cmd) || 
                   message.startsWith(cmd + ' ') || 
                   message.endsWith(' ' + cmd) ||
                   message === cmd;
        });
    }

    async handleHelp() {
        const comandos = this.listCommands();
        await this.speakIfEnabled('Aqui estão os comandos disponíveis');
        this.uiService.updateContent('Comandos disponíveis:\n' + comandos);
    }

    async handleOpenURL(url, message) {
        await this.speakIfEnabled(message);
        window.open(url, '_blank');
    }

    async handleSearch(engine, term) {
        let url;
        if (engine === 'google') {
            url = `https://www.google.com/search?q=${encodeURIComponent(term)}`;
            await this.speakIfEnabled(`Pesquisando no Google: ${term}`);
        } else if (engine === 'wikipedia') {
            url = `https://pt.wikipedia.org/wiki/${encodeURIComponent(term)}`;
            await this.speakIfEnabled(`Pesquisando na Wikipedia: ${term}`);
        }
        window.open(url, '_blank');
    }

    async handleTime() {
        const time = new Date().toLocaleTimeString('pt-BR');
        await this.speakIfEnabled(`São exatamente ${time}`);
        this.uiService.updateContent(`São exatamente ${time}`);
    }

    async handleDate() {
        const date = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateStr = date.toLocaleDateString('pt-BR', options);
        await this.speakIfEnabled(`Hoje é ${dateStr}`);
        this.uiService.updateContent(`Hoje é ${dateStr}`);
    }

    async handleJoke() {
        const piadas = [
            "Por que o pinheiro não se perde na floresta? Porque ele tem uma pinha GPS!",
            "O que o pagodeiro foi fazer na igreja? Cantar Pá God!",
            "Por que o jacaré tirou o filho da escola? Porque ele réptil de ano!",
            "Qual é o contrário de papelada? Pá vestida!",
            "Por que o vampiro foi ao ortodontista? Porque seus caninos estavam tortos!",
            "O que o zero disse para o oito? Belo cinto!",
            "Por que a plantinha não foi ao médico? Porque ela estava de folga!"
        ];
        const piada = piadas[Math.floor(Math.random() * piadas.length)];
        await this.speakIfEnabled(piada);
        this.uiService.updateContent(piada);
    }

    async handleTheme(theme) {
        this.uiService.setTheme(theme);
        await this.speakIfEnabled(`Modo ${theme === 'dark' ? 'escuro' : 'claro'} ativado`);
    }

    async handleCalculate(message) {
        try {
            let expressao = message.replace(/calcular|calcule/gi, '').trim();

            expressao = expressao
                .replace(/mais|soma|adiciona/g, '+')
                .replace(/menos|subtrai/g, '-')
                .replace(/vezes|multiplicado por|multiplicar/g, '*')
                .replace(/dividido por|divide/g, '/')
                .replace(/elevado a|potência|potencia/g, '**')
                .replace(/raiz quadrada de/g, 'Math.sqrt(')
                .replace(/porcentagem de|porcento de/g, '*0.01*')
                .replace(/seno de/g, 'Math.sin(')
                .replace(/cosseno de/g, 'Math.cos(')
                .replace(/tangente de/g, 'Math.tan(')
                .replace(/pi/g, 'Math.PI')
                .replace(/logaritmo de/g, 'Math.log(')
                .replace(/absoluto de/g, 'Math.abs(');

            if (!/^[0-9\s\+\-\*\/\(\)\.\,\%\^\!Math.sqrt Math.sin Math.cos Math.tan Math.PI Math.log Math.abs]+$/.test(expressao)) {
                throw new Error('Expressão inválida');
            }

            const resultado = Function('"use strict";return (' + expressao + ')')();
            const resultadoFormatado = Number.isInteger(resultado) ? resultado : resultado.toFixed(4);

            await this.speakIfEnabled(`O resultado é ${resultadoFormatado}`);
            this.uiService.updateContent(`${expressao} = ${resultadoFormatado}`);
        } catch (error) {
            console.error('Erro no cálculo:', error);
            await this.speakIfEnabled('Desculpe, não consegui realizar esse cálculo. Por favor, tente uma expressão mais simples.');
            this.uiService.updateContent('Erro no cálculo. Tente algo como: 2 mais 2, 10 vezes 5, raiz quadrada de 16');
        }
    }

    async handleTimer() {
        await this.speakIfEnabled('Iniciando cronômetro');
        this.uiService.startTimer();
    }

    async handleTranslate(text) {
        const url = `https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(text)}`;
        await this.speakIfEnabled('Abrindo tradutor');
        window.open(url, '_blank');
    }

    async handleReminder(message) {
        const tempo = 5 * 60 * 1000; // 5 minutos
        await this.speakIfEnabled(`Criando lembrete: ${message}`);
        setTimeout(() => {
            this.speechService.speak(`Lembrete: ${message}`);
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Lembrete", { body: message });
            }
        }, tempo);
    }

    async handleListVoices() {
        const vozes = this.speechService.getPortugueseVoices();
        const vozesStr = vozes.map(v => v.name).join(', ');
        await this.speakIfEnabled(`Vozes disponíveis em português: ${vozesStr}`);
        this.uiService.updateContent('Vozes disponíveis: ' + vozesStr);
    }

    async handleChangeVoice() {
        const vozes = this.speechService.getPortugueseVoices();
        if (vozes.length > 0) {
            const randomVoice = vozes[Math.floor(Math.random() * vozes.length)];
            await this.speakIfEnabled(`Trocando para a voz: ${randomVoice.name}`);
            this.uiService.updateContent(`Nova voz: ${randomVoice.name}`);
        } else {
            await this.speakIfEnabled('Não encontrei outras vozes em português');
        }
    }

    async handleOpenApp(app) {
        const os = detectOS();
        let url;
        let message;

        try {
            if (app === 'calculator') {
                if (os === 'Windows') {
                    url = 'calc://';
                    message = 'Abrindo calculadora do Windows';
                } else if (os === 'macOS') {
                    url = 'calculator://';
                    message = 'Abrindo calculadora do macOS';
                } else {
                    await this.speakIfEnabled('Em dispositivos móveis, por favor use a calculadora do seu sistema');
                    return;
                }
            } else if (app === 'notepad') {
                if (os === 'Windows') {
                    url = 'notepad://';
                    message = 'Abrindo bloco de notas do Windows';
                } else if (os === 'macOS') {
                    url = 'textedit://';
                    message = 'Abrindo TextEdit do macOS';
                } else {
                    await this.speakIfEnabled('Desculpe, não consigo abrir o editor de texto neste sistema operacional');
                    return;
                }
            } else if (app === 'settings') {
                if (os === 'Windows') {
                    url = 'ms-settings://';
                    message = 'Abrindo configurações do Windows';
                } else if (os === 'macOS') {
                    url = 'x-apple.systempreferences://';
                    message = 'Abrindo preferências do sistema';
                } else {
                    await this.speakIfEnabled('Desculpe, não consigo abrir as configurações neste sistema operacional');
                    return;
                }
            }

            await this.speakIfEnabled(message);
            window.open(url);
        } catch (error) {
            await this.speakIfEnabled(`Não foi possível abrir o ${app}`);
        }
    }

    async handleCamera() {
        if (!this.cameraService || !this.openAIService) {
            await this.speakIfEnabled('Serviços de câmera ou IA não disponíveis');
            this.uiService.updateContent('⚠️ Serviços de câmera ou IA não disponíveis. Verifique a configuração.');
            return;
        }

        // Verifica se a câmera está disponível
        const isAvailable = await this.cameraService.isAvailable();
        if (!isAvailable) {
            await this.speakIfEnabled('Câmera não encontrada no dispositivo');
            this.uiService.updateContent('⚠️ Nenhuma câmera encontrada no dispositivo.');
            return;
        }

        // Mostra interface de câmera
        this.uiService.showCameraInterface(this.cameraService, this.openAIService, this.speechService, this.shouldSpeak);
    }

    async handleReadDocument() {
        if (!this.cameraService || !this.openAIService) {
            await this.speakIfEnabled('Serviços de câmera ou IA não disponíveis');
            this.uiService.updateContent('⚠️ Serviços de câmera ou IA não disponíveis. Verifique a configuração.');
            return;
        }

        // Verifica se a câmera está disponível
        const isAvailable = await this.cameraService.isAvailable();
        if (!isAvailable) {
            await this.speakIfEnabled('Câmera não encontrada no dispositivo');
            this.uiService.updateContent('⚠️ Nenhuma câmera encontrada no dispositivo.');
            return;
        }

        // Mostra interface de documento
        this.uiService.showDocumentReaderInterface(this.cameraService, this.openAIService, this.speechService, this.shouldSpeak);
    }

    async handleHistory() {
        const history = HistoryManager.getAll();
        if (history.length === 0) {
            await this.speakIfEnabled('Não há histórico de conversas');
            this.uiService.updateContent('Nenhuma conversa no histórico');
        } else {
            const recent = history.slice(0, 5);
            const historyText = recent.map((entry, index) => 
                `${index + 1}. Você: ${entry.user}\n   Assistent MultiNegócios: ${entry.assistant.substring(0, 50)}...`
            ).join('\n\n');
            await this.speakIfEnabled(`Você tem ${history.length} conversas no histórico. Mostrando as 5 mais recentes.`);
            this.uiService.updateContent(`Histórico (${history.length} conversas):\n\n${historyText}`);
        }
    }

    async handleWebSearch(query) {
        if (!this.webSearchService) {
            await this.speakIfEnabled('Serviço de busca na web não disponível');
            this.uiService.updateContent('Serviço de busca na web não disponível');
            return;
        }

        this.uiService.updateContent('Buscando informações na web...');
        
        try {
            const results = await this.webSearchService.searchWeb(query);
            
            if (results) {
                await this.speakIfEnabled(`Encontrei informações sobre ${query}`);
                this.uiService.showRichResponse(results);
            } else {
                await this.speakIfEnabled('Não encontrei informações atualizadas');
                this.uiService.updateContent(`Não encontrei informações atualizadas sobre "${query}". Tente reformular sua busca ou use o comando "pesquisar no google [termo]" para abrir o Google.`);
            }
        } catch (error) {
            console.error('Erro na busca web:', error);
            await this.speakIfEnabled('Erro ao buscar informações na web');
            this.uiService.updateContent('Erro ao buscar informações na web. Tente novamente.');
        }
    }

    listCommands() {
        const comandos = [
            "abrir youtube",
            "abrir google",
            "abrir linkedin",
            "abrir facebook",
            "abrir instagram",
            "abrir twitter",
            "pesquisar no google [termo]",
            "pesquisar na wikipedia [termo]",
            "buscar na web [termo]",
            "que horas são",
            "que dia é hoje",
            "tocar música",
            "previsão do tempo",
            "contar piada",
            "modo escuro",
            "modo claro",
            "calcular [expressão]",
            "cronômetro",
            "traduzir [texto]",
            "criar lembrete [mensagem]",
            "aumentar volume",
            "diminuir volume",
            "listar vozes",
            "trocar voz",
            "abrir calculadora",
            "abrir bloco de notas",
            "abrir câmera",
            "ler documento",
            "reconhecer documento",
            "abrir configurações",
            "histórico",
            "limpar histórico"
        ];
        return comandos.join('\n');
    }
}

