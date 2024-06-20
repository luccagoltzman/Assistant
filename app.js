const btn = document.querySelector('.talk');
const content = document.querySelector('.content');
let voices = [];

// Função para listar vozes disponíveis
function populateVoices() {
    voices = window.speechSynthesis.getVoices();
    console.log(voices); // Verifique as vozes disponíveis no console
    if (voices.length) {
        speak("Iniciando CANGALHA...", 1.2);  // Fala mais rápida
        wishMe();
    }
}

// Função para definir a voz
function setVoice(utterance) {
    const voice = voices.find(voice => voice.name === 'Microsoft Maria - Portuguese (Brazil)');
    if (voice) {
        utterance.voice = voice;
    }
}

// Função para falar o texto com a voz ajustada
function speak(text, rate = 1) {
    const text_speak = new SpeechSynthesisUtterance(text);
    setVoice(text_speak);

    text_speak.rate = rate;  // Ajuste a velocidade da fala aqui
    text_speak.volume = 1;
    text_speak.pitch = 1;

    window.speechSynthesis.speak(text_speak);
}

// Função para saudação com diferentes velocidades de fala
function wishMe() {
    const day = new Date();
    const hour = day.getHours();

    if (hour >= 0 && hour < 12) {
        speak("Bom dia moço...", 1.2);  // Fala mais rápida
    } else if (hour >= 12 && hour < 17) {
        speak("Boa tarde moço...", 1.2);  // Fala mais rápida
    } else {
        speak("Boa noite moço...", 1.2);  // Fala mais rápida
    }
}

window.addEventListener('load', () => {
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

recognition.onresult = (event) => {
    const currentIndex = event.resultIndex;
    const transcript = event.results[currentIndex][0].transcript;
    content.textContent = transcript;
    takeCommand(transcript.toLowerCase());
};

btn.addEventListener('click', () => {
    content.textContent = "Listening...";
    recognition.start();
});

function takeCommand(message) {
    if (message.includes('hey') || message.includes('hello') || message.includes('oi') || message.includes('oi, cangalha') || message.includes('olá, cangalha') || message.includes('Hello, cangalha')) {
        speak("Olá Senhor, como posso lhe ajudar?", 1.2);  // Fala mais rápida
    }
    else if (message.includes('tudo bem') || message.includes('como você está') || message.includes('beleza') || message.includes('tudo beleza') || message.includes('como você está hoje') || message.includes('como vai')) {
        speak("Estou muito bem! E você?", 1.2);  // Fala mais rápida
    }
    else if (message.includes('está me escutando') || message.includes('não conseguiu me escutar')) {
        speak("Análise... Desculpa a demora, senhor! É o TDH", 1.2);  // Fala mais rápida
    }
    else if (message.includes('tchau') || message.includes('tchau cangalha') || message.includes('até logo') || message.includes('adeus')) {
        speak("Tem certeza? Sentirei sua falta...", 1.2);  // Fala mais rápida
    }
    else if (message.includes("Abrir google") || message.includes('Google')) {
        window.open("https://google.com", "_blank");
        speak("Abrindo Google", 1.2);  // Fala mais rápida
    } else if (message.includes("open youtube") || message.includes('youtube')) {
        window.open("https://youtube.com", "_blank");
        speak("Abrindo Youtube...", 1.2);  // Fala mais rápida
    } else if (message.includes("abrir linkedin")) {
        window.open("https://www.linkedin.com", "_blank");
        speak("Abrindo Linkedin...", 1.2);  // Fala mais rápida
    } else if (message.includes('what is') || message.includes('who is') || message.includes('what are')) {
        window.open(`https://www.google.com/search?q=${message.replace(" ", "+")}`, "_blank");
        const finalText = "Isto é o que encontrei na internet sobre " + message;
        speak(finalText, 1.2);  // Fala mais rápida
    } else if (message.includes('wikipedia')) {
        window.open(`https://en.wikipedia.org/wiki/${message.replace("wikipedia", "").trim()}`, "_blank");
        const finalText = "Isto é o que encontrei na Wikipedia sobre " + message;
        speak(finalText, 1.2);  // Fala mais rápida
    } else if (message.includes('Time') || message.includes('Que horas são?') || message.includes('Me diga as horas') || message.includes('horas')) {
        const time = new Date().toLocaleString(undefined, { hour: "numeric", minute: "numeric" });
        const finalText = "São exatamente " + time;
        speak(finalText, 1.2);  // Fala mais rápida
    } else if (message.includes('date') || message.includes('data') || message.includes('que dia é hoje')) {
        const date = new Date().toLocaleString(undefined, { month: "short", day: "numeric" });
        const finalText = "A data de hoje é " + date;
        speak(finalText, 1.2);  // Fala mais rápida
    } else if (message.includes('calculator') || message.includes('calculadora')) {
        window.open('Calculator:///');
        const finalText = "Abrindo Calculadora";
        speak(finalText, 1.2);  // Fala mais rápida
    } else if (message.includes('Bloco de Notas') || message.includes('Notas')) {
        window.open('Bloco de Notas:///');
        const finalText = "Abrindo Bloco de notas";
        speak(finalText, 1.2);  // Fala mais rápida
    } else {
        window.open(`https://www.google.com/search?q=${message.replace(" ", "+")}`, "_blank");
        const finalText = "Encontrei algumas informações para " + message + " no Google";
        speak(finalText, 1.2);  // Fala mais rápida
    }
}
