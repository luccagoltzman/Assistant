import config from './config.js';

const talkContainer = document.querySelector('.talk.input');
const content = document.querySelector('.content');
const apiKey = config.OPENAI_API_KEY;
let voices = [];
let isProcessing = false; // Variável para controlar se está processando uma requisição
let currentUtterance = null; // Armazena a utterance atual

// Função para parar qualquer fala em andamento
function stopSpeaking() {
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    if (currentUtterance) {
        currentUtterance.onend = null;
        currentUtterance = null;
    }
    if (isProcessing) {
        isProcessing = false;
    }
}

// Função para listar vozes disponíveis
function populateVoices() {
    voices = window.speechSynthesis.getVoices();
    console.log("Vozes disponíveis:", voices.map(v => `${v.name} (${v.lang})`)); // Lista todas as vozes
    if (voices.length) {
        speak("INICIANDO CANGALHA...", 1.5);
        wishMe();
    }
}

// Função para definir a voz
function setVoice(utterance) {
    // Tenta encontrar a melhor voz em português na seguinte ordem:
    const voiceOptions = [
        'Microsoft Daniel - Portuguese (Brazil)', // Voz masculina natural
        'Microsoft Maria - Portuguese (Brazil)',  // Voz feminina natural
        'Google português do Brasil',            // Voz do Google
        'Portuguese (Brazil)',                   // Qualquer voz em português
    ];

    let selectedVoice = null;
    
    // Procura pela primeira voz disponível na ordem de preferência
    for (const voiceName of voiceOptions) {
        const voice = voices.find(v => 
            v.name.includes(voiceName) || 
            v.lang.includes('pt-BR') ||
            v.lang.includes('pt_BR')
        );
        if (voice) {
            selectedVoice = voice;
            break;
        }
    }

    // Se encontrou uma voz, configura com parâmetros para maior naturalidade
    if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.pitch = 1.0;     // Tom natural (1.0 é o padrão)
        utterance.rate = 1.1;      // Velocidade levemente mais rápida
        utterance.volume = 1.0;    // Volume máximo
    }
}

// Função para falar o texto com a voz ajustada
function speak(text, rate = 1.1) {
    stopSpeaking();
    const text_speak = new SpeechSynthesisUtterance(text);
    currentUtterance = text_speak;
    
    // Adiciona pausas naturais no texto
    text = addNaturalPauses(text);
    text_speak.text = text;
    
    setVoice(text_speak);

    // Adiciona evento para limpar a referência quando a fala terminar
    text_speak.onend = () => {
        currentUtterance = null;
    };

    window.speechSynthesis.speak(text_speak);
}

// Função para adicionar pausas naturais no texto
function addNaturalPauses(text) {
    // Adiciona pequenas pausas após pontuação
    text = text.replace(/([.!?]),/g, '$1... ');
    text = text.replace(/([,;:])/g, '$1 ');
    
    // Adiciona ênfase em palavras importantes
    const emphasisWords = ['importante', 'atenção', 'cuidado', 'urgente', 'perigo'];
    emphasisWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        text = text.replace(regex, `... ${word}... `);
    });
    
    return text;
}

// Função para saudação com diferentes velocidades de fala
function wishMe() {
    const day = new Date();
    const hour = day.getHours();

    if (hour >= 0 && hour < 12) {
        speak("Bom dia moço...", 1.5);
    } else if (hour >= 12 && hour < 17) {
        speak("Boa tarde moço...", 1.5);
    } else {
        speak("Boa noite moço...", 1.5);
    }
}

window.addEventListener('load', () => {
    // Solicita permissão para notificações
    if ("Notification" in window) {
        Notification.requestPermission();
    }

    window.speechSynthesis.onvoiceschanged = () => {
        if (voices.length === 0) {
            populateVoices();
        }
    };
    if (voices.length === 0) {
        populateVoices();
    }
});

// Inicializa o reconhecimento de voz
let recognition;
try {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        throw new Error('Reconhecimento de voz não suportado');
    }
    recognition = new SpeechRecognition();
    
    // Configurando o reconhecimento de voz em português
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        console.log('Reconhecimento de voz iniciado');
        content.textContent = "Estou escutando...";
        talkContainer.classList.add('listening');
    };

    recognition.onend = () => {
        console.log('Reconhecimento de voz finalizado');
        content.textContent = "Clique para falar";
        talkContainer.classList.remove('listening');
    };

    recognition.onresult = (event) => {
        const currentIndex = event.resultIndex;
        const transcript = event.results[currentIndex][0].transcript;
        content.textContent = transcript;
        takeCommand(transcript.toLowerCase());
    };

    recognition.onerror = (event) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        content.textContent = "Erro no reconhecimento de voz. Por favor, tente novamente.";
        talkContainer.classList.remove('listening');
        if (event.error === 'not-allowed') {
            speak("Por favor, permita o acesso ao microfone para que eu possa te ouvir.", 1.5);
        }
    };
} catch (error) {
    console.error('Erro ao inicializar reconhecimento de voz:', error);
    content.textContent = "Seu navegador não suporta reconhecimento de voz. Por favor, use o Google Chrome.";
}

// Função para iniciar o reconhecimento de voz
async function startRecognition() {
    try {
        if (!recognition) {
            speak("Desculpe, seu navegador não suporta reconhecimento de voz. Por favor, use o Google Chrome.", 1.5);
            return;
        }

        // Para qualquer fala em andamento
        window.speechSynthesis.cancel();
        stopSpeaking();
        
        // Cancela qualquer reconhecimento em andamento
        recognition.abort();
        
        // Tenta iniciar o reconhecimento
        await recognition.start();
        
    } catch (error) {
        console.error('Erro ao iniciar reconhecimento:', error);
        if (error.name === 'NotAllowedError') {
            speak("Por favor, permita o acesso ao microfone para que eu possa te ouvir.", 1.5);
        } else {
            speak("Ocorreu um erro ao tentar iniciar o reconhecimento de voz. Tente novamente.", 1.5);
        }
        talkContainer.classList.remove('listening');
    }
}

// Eventos do container
talkContainer.addEventListener('mousedown', () => {
    window.speechSynthesis.cancel();
    stopSpeaking();
});

talkContainer.addEventListener('click', startRecognition);

// Função para lidar com comandos do usuário
async function takeCommand(message) {
    if (isProcessing) {
        return;
    }
    
    isProcessing = true;
    
    try {
        if (message.includes("ajuda") || message.includes("comandos disponíveis")) {
            const comandos = listarComandos();
            speak("Aqui estão os comandos disponíveis:", 1.5);
            content.textContent = "Comandos disponíveis:\n" + comandos;
        } else if (message.includes("abrir youtube")) {
            speak("Abrindo YouTube", 1.5);
            window.open("https://www.youtube.com", "_blank");
        } else if (message.includes("abrir google")) {
            speak("Abrindo Google", 1.5);
            window.open("https://www.google.com", "_blank");
        } else if (message.includes("abrir linkedin")) {
            speak("Abrindo LinkedIn", 1.5);
            window.open("https://www.linkedin.com", "_blank");
        } else if (message.includes("abrir facebook")) {
            speak("Abrindo Facebook", 1.5);
            window.open("https://www.facebook.com", "_blank");
        } else if (message.includes("abrir instagram")) {
            speak("Abrindo Instagram", 1.5);
            window.open("https://www.instagram.com", "_blank");
        } else if (message.includes("abrir twitter")) {
            speak("Abrindo Twitter", 1.5);
            window.open("https://www.twitter.com", "_blank");
        } else if (message.includes("pesquisar no google")) {
            const termo = message.replace("pesquisar no google", "").trim();
            speak("Pesquisando no Google: " + termo, 1.5);
            window.open(`https://www.google.com/search?q=${encodeURIComponent(termo)}`, "_blank");
        } else if (message.includes("pesquisar na wikipedia")) {
            const termo = message.replace("pesquisar na wikipedia", "").trim();
            speak("Pesquisando na Wikipedia: " + termo, 1.5);
            window.open(`https://pt.wikipedia.org/wiki/${encodeURIComponent(termo)}`, "_blank");
        } else if (message.includes("aumentar volume")) {
            const utterance = new SpeechSynthesisUtterance();
            utterance.volume = Math.min((utterance.volume || 1) + 0.2, 1);
            speak("Volume aumentado", 1.5);
        } else if (message.includes("diminuir volume")) {
            const utterance = new SpeechSynthesisUtterance();
            utterance.volume = Math.max((utterance.volume || 1) - 0.2, 0);
            speak("Volume diminuído", 1.5);
        } else if (message.includes("criar lembrete")) {
            const lembrete = message.replace("criar lembrete", "").trim();
            const tempo = 5 * 60 * 1000; // 5 minutos por padrão
            speak("Criando lembrete: " + lembrete, 1.5);
            setTimeout(() => {
                speak("Lembrete: " + lembrete, 1.5);
                // Tenta criar uma notificação se disponível
                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification("Lembrete", { body: lembrete });
                }
            }, tempo);
        } else if (message.includes("abrir calculadora")) {
            const os = detectOS();
            try {
                if (os === 'Windows') {
                    speak("Abrindo calculadora do Windows", 1.5);
                    window.open("calc://");
                } else if (os === 'macOS') {
                    speak("Abrindo calculadora do macOS", 1.5);
                    window.open("calculator://");
                } else if (os === 'Android' || os === 'iOS') {
                    speak("Em dispositivos móveis, por favor use a calculadora do seu sistema", 1.5);
                } else {
                    speak("Desculpe, não consigo abrir a calculadora neste sistema operacional", 1.5);
                }
            } catch (error) {
                speak("Não foi possível abrir a calculadora", 1.5);
            }
        } else if (message.includes("abrir bloco de notas")) {
            const os = detectOS();
            try {
                if (os === 'Windows') {
                    speak("Abrindo bloco de notas do Windows", 1.5);
                    window.open("notepad://");
                } else if (os === 'macOS') {
                    speak("Abrindo TextEdit do macOS", 1.5);
                    window.open("textedit://");
                } else {
                    speak("Desculpe, não consigo abrir o editor de texto neste sistema operacional", 1.5);
                }
            } catch (error) {
                speak("Não foi possível abrir o editor de texto", 1.5);
            }
        } else if (message.includes("que horas são")) {
            const time = new Date().toLocaleTimeString();
            speak("São exatamente " + time, 1.5);
            content.textContent = "São exatamente " + time;
        } else if (message.includes("que dia é hoje")) {
            const date = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const dateStr = date.toLocaleDateString('pt-BR', options);
            speak("Hoje é " + dateStr, 1.5);
            content.textContent = "Hoje é " + dateStr;
        } else if (message.includes("tocar música")) {
            speak("Tocando sua playlist favorita no YouTube Music", 1.5);
            window.open("https://music.youtube.com", "_blank");
        } else if (message.includes("previsão do tempo")) {
            speak("Abrindo previsão do tempo", 1.5);
            window.open("https://weather.com/pt-BR/clima/hoje/l/-23.55,-46.64", "_blank");
        } else if (message.includes("contar piada")) {
            const piadas = [
                "Por que o pinheiro não se perde na floresta? Porque ele tem uma pinha GPS!",
                "O que o pagodeiro foi fazer na igreja? Cantar Pá God!",
                "Por que o jacaré tirou o filho da escola? Porque ele réptil de ano!",
                "Qual é o contrário de papelada? Pá vestida!",
                "Por que o vampiro foi ao ortodontista? Porque seus caninos estavam tortos!"
            ];
            const piada = piadas[Math.floor(Math.random() * piadas.length)];
            speak(piada, 1.5);
            content.textContent = piada;
        } else if (message.includes("modo escuro")) {
            document.body.style.backgroundColor = "#1a1a1a";
            document.body.style.color = "#000";
            const main = document.querySelector('.main');
            if (main) {
                main.style.backgroundColor = "#000";
            }
            const input = document.querySelector('.input');
            if (input) {
                input.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            }
            const content = document.querySelector('.content');
            if (content) {
                content.style.color = "#ffffff";
            }
            const imageContainer = document.querySelector('.image-container p');
            if (imageContainer) {
                imageContainer.style.color = "#ffffff";
            }
            speak("Modo escuro ativado", 1.5);
        } else if (message.includes("modo claro")) {
            document.body.style.backgroundColor = "#ffffff";
            document.body.style.color = "#000000";
            const main = document.querySelector('.main');
            if (main) {
                main.style.backgroundColor = "#ffffff";
            }
            const input = document.querySelector('.input');
            if (input) {
                input.style.backgroundColor = "rgb(202 253 255 / 50%)";
            }
            const content = document.querySelector('.content');
            if (content) {
                content.style.color = "#aed0d0";
            }
            const imageContainer = document.querySelector('.image-container p');
            if (imageContainer) {
                imageContainer.style.color = "#324042";
            }
            speak("Modo claro ativado", 1.5);
        } else if (message.includes("calcular")) {
            try {
                let expressao = message.replace("calcular", "").trim();
                
                // Substitui palavras por operadores matemáticos
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

                // Verifica se a expressão contém apenas caracteres permitidos
                if (!/^[0-9\s\+\-\*\/\(\)\.\,\%\^\!Math.sqrt Math.sin Math.cos Math.tan Math.PI Math.log Math.abs]+$/.test(expressao)) {
                    throw new Error('Expressão inválida');
                }

                // Avalia a expressão de forma segura
                const resultado = Function('"use strict";return (' + expressao + ')')();
                
                // Formata o resultado para no máximo 4 casas decimais
                const resultadoFormatado = Number.isInteger(resultado) ? resultado : resultado.toFixed(4);
                
                speak("O resultado é " + resultadoFormatado, 1.5);
                content.textContent = `${expressao} = ${resultadoFormatado}`;
            } catch (error) {
                console.error('Erro no cálculo:', error);
                speak("Desculpe, não consegui realizar esse cálculo. Por favor, tente uma expressão mais simples ou verifique a sintaxe.", 1.5);
                content.textContent = "Erro no cálculo. Tente algo como: 2 mais 2, 10 vezes 5, raiz quadrada de 16";
            }
        } else if (message.includes("cronômetro")) {
            let segundos = 0;
            let minutos = 0;
            let horas = 0;
            speak("Iniciando cronômetro", 1.5);
            
            // Pega o botão do microfone e cria um elemento para o tempo
            const micBtn = document.querySelector('.mic-btn');
            const micIcon = micBtn.querySelector('i');
            let timeSpan = micBtn.querySelector('.timer');
            
            if (!timeSpan) {
                timeSpan = document.createElement('span');
                timeSpan.className = 'timer';
                micBtn.appendChild(timeSpan);
            }
            
            // Função para formatar o tempo com zeros à esquerda
            const formatarTempo = (valor) => valor.toString().padStart(2, '0');
            
            const cronometro = setInterval(() => {
                if (!isProcessing) {
                    clearInterval(cronometro);
                    timeSpan.remove();
                    return;
                }
                
                segundos++;
                if (segundos === 60) {
                    segundos = 0;
                    minutos++;
                    if (minutos === 60) {
                        minutos = 0;
                        horas++;
                    }
                }
                
                // Formata o tempo
                const tempoFormatado = `${formatarTempo(horas)}:${formatarTempo(minutos)}:${formatarTempo(segundos)}`;
                
                // Atualiza o conteúdo do span do tempo
                timeSpan.textContent = tempoFormatado;
                
                if (message.includes("parar")) {
                    clearInterval(cronometro);
                    speak("Cronômetro parado em " + tempoFormatado, 1.5);
                    timeSpan.remove();
                }
            }, 1000);
        } else if (message.includes("traduzir")) {
            const texto = message.replace("traduzir", "").trim();
            const url = `https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(texto)}`;
            speak("Abrindo tradutor", 1.5);
            window.open(url, "_blank");
        } else if (message.includes("listar vozes")) {
            const vozesDisponiveis = voices
                .filter(v => v.lang.includes('pt') || v.lang.includes('PT'))
                .map(v => v.name)
                .join(", ");
            speak("Vozes disponíveis em português: " + vozesDisponiveis, 1.1);
            content.textContent = "Vozes disponíveis: " + vozesDisponiveis;
        } else if (message.includes("trocar voz")) {
            const nextVoice = voices.find(v => 
                v.lang.includes('pt') && 
                (!currentUtterance?.voice || v.name !== currentUtterance.voice.name)
            );
            if (nextVoice) {
                speak("Trocando para a voz: " + nextVoice.name, 1.1);
                content.textContent = "Nova voz: " + nextVoice.name;
            } else {
                speak("Não encontrei outras vozes em português", 1.1);
            }
        } else if (message.includes("abrir câmera")) {
            try {
                speak("Tentando abrir a câmera", 1.5);
                navigator.mediaDevices.getUserMedia({ video: true })
                    .then(function(stream) {
                        const videoElement = document.createElement('video');
                        videoElement.srcObject = stream;
                        videoElement.autoplay = true;
                        document.body.appendChild(videoElement);
                        videoElement.style.position = 'fixed';
                        videoElement.style.top = '20px';
                        videoElement.style.right = '20px';
                        videoElement.style.width = '320px';
                        videoElement.style.height = '240px';
                        videoElement.style.zIndex = '1000';
                        
                        const closeButton = document.createElement('button');
                        closeButton.textContent = 'X';
                        closeButton.style.position = 'fixed';
                        closeButton.style.top = '25px';
                        closeButton.style.right = '25px';
                        closeButton.style.zIndex = '1001';
                        closeButton.onclick = function() {
                            stream.getTracks().forEach(track => track.stop());
                            videoElement.remove();
                            closeButton.remove();
                        };
                        document.body.appendChild(closeButton);
                    })
                    .catch(function(err) {
                        speak("Não foi possível acessar a câmera. Verifique as permissões.", 1.5);
                    });
            } catch (error) {
                speak("Erro ao tentar abrir a câmera", 1.5);
            }
        } else if (message.includes("abrir configurações")) {
            const os = detectOS();
            try {
                if (os === 'Windows') {
                    speak("Abrindo configurações do Windows", 1.5);
                    window.open("ms-settings://");
                } else if (os === 'macOS') {
                    speak("Abrindo preferências do sistema", 1.5);
                    window.open("x-apple.systempreferences://");
                } else {
                    speak("Desculpe, não consigo abrir as configurações neste sistema operacional", 1.5);
                }
            } catch (error) {
                speak("Não foi possível abrir as configurações", 1.5);
            }
        } else {
            // Verifica se a chave API está disponível e válida
            if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
                speak("Desculpe, não posso responder perguntas gerais no momento pois não estou conectado à API. Por favor, use os comandos específicos como 'que horas são', 'abrir youtube', entre outros.", 1.5);
                content.textContent = "API não configurada. Use comandos específicos.";
                return;
            }

            try {
                // Enviar a mensagem para a API OpenAI e obter a resposta
                const response = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: 'POST',
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: 'Bearer ' + apiKey
                    },
                    body: JSON.stringify({
                        model: "gpt-3.5-turbo",
                        messages: [{ "role": "user", "content": message }],
                        max_tokens: 2048,
                        temperature: 1
                    })
                });

                if (!response.ok) {
                    throw new Error('Erro na API');
                }

                const data = await response.json();
                if (data.choices && data.choices.length > 0) {
                    const reply = data.choices[0].message.content;
                    speak(reply, 1.5);
                    content.textContent = reply;
                }
            } catch (error) {
                console.error('Erro na API:', error);
                speak("Desculpe, não posso responder perguntas gerais no momento. Por favor, use os comandos específicos.");
                content.textContent = "Use comandos específicos como: abrir youtube, que horas são, previsão do tempo, etc.";
            }
        }
    } catch (error) {
        console.error('Error:', error);
        speak("Desculpe, encontrei um problema ao processar sua solicitação. Por favor, tente novamente mais tarde.");
        content.textContent = "Desculpe, encontrei um problema ao processar sua solicitação. Por favor, tente novamente mais tarde.";
    } finally {
        isProcessing = false;
    }
}

// Adiciona uma função para listar todos os comandos disponíveis
function listarComandos() {
    const comandos = [
        "abrir youtube",
        "abrir google",
        "abrir linkedin",
        "abrir facebook",
        "abrir instagram",
        "abrir twitter",
        "pesquisar no google [termo]",
        "pesquisar na wikipedia [termo]",
        "que horas são",
        "qual é a data",
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
        "abrir configurações"
    ];
    
    return comandos.join("\n");
}

// Adicionar função para detectar o sistema operacional
function detectOS() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.includes('windows')) return 'Windows';
    if (userAgent.includes('mac os x')) return 'macOS';
    if (userAgent.includes('android')) return 'Android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'iOS';
    if (userAgent.includes('linux')) return 'Linux';
    return 'Unknown';
}
