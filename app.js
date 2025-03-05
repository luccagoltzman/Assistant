import config from './config.js';

const btn = document.querySelector('#talk-btn');
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

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

// Configurando o reconhecimento de voz em português
recognition.lang = 'pt-BR';
recognition.continuous = false;
recognition.interimResults = false;

recognition.onresult = (event) => {
    const currentIndex = event.resultIndex;
    const transcript = event.results[currentIndex][0].transcript;
    content.textContent = transcript;
    takeCommand(transcript.toLowerCase());
};

recognition.onerror = (event) => {
    console.error('Erro no reconhecimento de voz:', event.error);
    content.textContent = "Erro no reconhecimento de voz. Por favor, tente novamente.";
};

// Adiciona um evento mousedown para garantir que a fala seja interrompida imediatamente
btn.addEventListener('mousedown', () => {
    window.speechSynthesis.cancel();
    stopSpeaking();
});

btn.addEventListener('click', () => {
    // Cancela qualquer reconhecimento em andamento
    recognition.abort();
    
    // Atualiza a interface
    content.textContent = "Estou escutando...";
    
    // Inicia novo reconhecimento após garantir que tudo foi cancelado
    setTimeout(() => {
        recognition.start();
    }, 200);
});

// Função para lidar com comandos do usuário
async function takeCommand(message) {
    if (isProcessing) {
        return;
    }
    
    isProcessing = true;
    
    try {
        if (message.includes("abrir youtube")) {
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
            speak("Abrindo calculadora", 1.5);
            window.open("calc://", "_blank");
        } else if (message.includes("abrir bloco de notas")) {
            speak("Abrindo bloco de notas", 1.5);
            window.open("notepad://", "_blank");
        } else if (message.includes("que horas são")) {
            const time = new Date().toLocaleTimeString();
            speak("São exatamente " + time, 1.5);
            content.textContent = "São exatamente " + time;
        } else if (message.includes("qual é a data")) {
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
            document.body.style.color = "#ffffff";
            speak("Modo escuro ativado", 1.5);
        } else if (message.includes("modo claro")) {
            document.body.style.backgroundColor = "#ffffff";
            document.body.style.color = "#000000";
            speak("Modo claro ativado", 1.5);
        } else if (message.includes("calcular")) {
            try {
                const expressao = message.replace("calcular", "").trim();
                const resultado = eval(expressao);
                speak("O resultado é " + resultado, 1.5);
                content.textContent = "O resultado é " + resultado;
            } catch (error) {
                speak("Desculpe, não consegui realizar esse cálculo", 1.5);
            }
        } else if (message.includes("cronômetro")) {
            let segundos = 0;
            speak("Iniciando cronômetro", 1.5);
            const cronometro = setInterval(() => {
                if (!isProcessing) {
                    clearInterval(cronometro);
                    return;
                }
                segundos++;
                content.textContent = `Tempo: ${segundos} segundos`;
                if (message.includes("parar")) {
                    clearInterval(cronometro);
                    speak("Cronômetro parado em " + segundos + " segundos", 1.5);
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
        } else {
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

            const data = await response.json();
            if (data.choices && data.choices.length > 0) {
                const reply = data.choices[0].message.content;
                speak(reply, 1.5);
                content.textContent = reply;
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
