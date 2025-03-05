# CANGALHA - Assistente Virtual

Um assistente virtual em português que utiliza reconhecimento de voz e a API da OpenAI para interagir com o usuário.

## Funcionalidades

- Reconhecimento de voz em português
- Síntese de voz usando Microsoft Maria (português brasileiro)
- Comandos de voz para diversas funções
- Integração com ChatGPT para respostas inteligentes
- Interface amigável e responsiva

## Configuração

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/Assistant.git
cd Assistant
```

2. Configure a chave API:
- Renomeie o arquivo `config.example.js` para `config.js`
- Substitua "SUA_CHAVE_API_AQUI" pela sua chave API da OpenAI

3. Inicie um servidor local:
```bash
python -m http.server 8000
```

4. Acesse a aplicação:
- Abra http://localhost:8000 no seu navegador
- Permita o acesso ao microfone quando solicitado

## Comandos Disponíveis

### Navegação
- "Abrir YouTube" - Abre o YouTube
- "Abrir Google" - Abre o Google
- "Abrir LinkedIn" - Abre o LinkedIn
- "Tocar música" - Abre o YouTube Music
- "Notícias" - Abre o portal de notícias G1

### Utilidades
- "Que horas são" - Informa o horário atual
- "Qual é a data" - Informa a data atual completa
- "Previsão do tempo" - Abre a previsão do tempo
- "Traduzir [texto]" - Abre o Google Translate com o texto
- "Calcular [expressão]" - Realiza cálculos matemáticos
- "Cronômetro" - Inicia um cronômetro

### Personalização
- "Modo escuro" - Ativa o tema escuro
- "Modo claro" - Ativa o tema claro

### Entretenimento
- "Contar piada" - Conta uma piada aleatória
- "Quem me deve" - Easter egg divertido

### ChatGPT
- Qualquer outra frase será processada pelo ChatGPT para respostas inteligentes

## Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript (ES6+)
- Web Speech API
- OpenAI API

## Segurança

⚠️ **IMPORTANTE**: Nunca compartilhe sua chave API da OpenAI publicamente ou commite ela no Git.

## Contribuição

Sinta-se à vontade para contribuir com o projeto através de pull requests. 
