const btn = document.querySelector('.talk');
const content = document.querySelector('.content');
const apiKey = process.env.OPENAI_API_KEY;
let voices = [];

// Função para listar vozes disponíveis
function populateVoices() {
    voices = window.speechSynthesis.getVoices();
    console.log(voices); // Verifique as vozes disponíveis no console
    if (voices.length) {
        speak("INICIANDO CANGALHA...", 1.5);  // Fala mais rápida
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

    text_speak.rate = rate;
    text_speak.volume = 1;
    text_speak.pitch = 1;

    window.speechSynthesis.speak(text_speak);
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
    content.textContent = "Estou escutando...";
    recognition.start();
});

// Função para lidar com comandos do usuário
function takeCommand(message) {
    if (message.includes("abrir youtube")) {
        speak("Abrindo YouTube", 1.5);
        window.open("https://www.youtube.com", "_blank");
        return;
    } else if (message.includes("abrir google")) {
        speak("Abrindo Google", 1.5);
        window.open("https://www.google.com", "_blank");
        return;
    } else if (message.includes("abrir linkedin")) {
        speak("Abrindo LinkedIn", 1.5);
        window.open("https://www.linkedin.com", "_blank");
        return;
    }
    else if (message.includes("quem me deve")) {
        speak("Celso, faz o pix, ladão", 1.5);
    }
     else if (message.includes("que horas são")) {
        const time = new Date().toLocaleTimeString();
        speak("São exatamente " + time, 1.5);
        content.textContent = "São extamente " + time;
        return;
    } else {


        // Enviar a mensagem para a API OpenAI e obter a resposta
        fetch("https://api.openai.com/v1/chat/completions", {
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
        })
            .then((response) => response.json())
            .then((response) => {
                console.log(response);
                if (response.choices && response.choices.length > 0) {
                    const reply = response.choices[0].message.content;
                    speak(reply, 1.5);
                    content.textContent = reply;
                }
            })
            .catch((error) => {
                console.error('Error:', error);
                speak("Desculpe, encontrei um problema ao processar sua solicitação. Por favor, tente novamente mais tarde.");
                content.textContent = "Desculpe, encontrei um problema ao processar sua solicitação. Por favor, tente novamente mais tarde.";
            });
    }
}
