# 🎙️ Assistent MultiNegócios - Assistente Virtual Inteligente

Um assistente virtual avançado em português que utiliza reconhecimento de voz, síntese de voz e a API da OpenAI para interagir com o usuário de forma natural e inteligente.

![Version](https://img.shields.io/badge/version-2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Funcionalidades Principais

### 🎯 Recursos de Voz
- ✅ **Reconhecimento de voz** em português brasileiro
- ✅ **Síntese de voz** com vozes naturais em português
- ✅ **Múltiplas vozes** disponíveis com opção de troca
- ✅ **Controle de volume** e velocidade de fala

### 🤖 Inteligência Artificial
- ✅ **Integração com OpenAI GPT** para respostas inteligentes
- ✅ **Histórico de conversas** com persistência local
- ✅ **Contexto de conversa** mantido entre interações

### 🎨 Interface Moderna
- ✅ **Design responsivo** e moderno
- ✅ **Modo escuro/claro** com persistência
- ✅ **Animações suaves** e feedback visual
- ✅ **Acessibilidade** melhorada

### 📱 Comandos Disponíveis

#### 🌐 Navegação Web
- `"abrir youtube"` - Abre o YouTube
- `"abrir google"` - Abre o Google
- `"abrir linkedin"` - Abre o LinkedIn
- `"abrir facebook"` - Abre o Facebook
- `"abrir instagram"` - Abre o Instagram
- `"abrir twitter"` - Abre o Twitter
- `"tocar música"` - Abre o YouTube Music

#### 🔍 Pesquisas
- `"pesquisar no google [termo]"` - Pesquisa no Google
- `"pesquisar na wikipedia [termo]"` - Pesquisa na Wikipedia

#### ⏰ Data e Hora
- `"que horas são"` - Informa o horário atual
- `"que dia é hoje"` - Informa a data completa

#### 🧮 Utilidades
- `"calcular [expressão]"` - Realiza cálculos matemáticos
- `"cronômetro"` - Inicia um cronômetro
- `"traduzir [texto]"` - Abre o Google Translate
- `"criar lembrete [mensagem]"` - Cria um lembrete
- `"previsão do tempo"` - Abre a previsão do tempo

#### 🎨 Personalização
- `"modo escuro"` - Ativa o tema escuro
- `"modo claro"` - Ativa o tema claro
- `"listar vozes"` - Lista vozes disponíveis
- `"trocar voz"` - Troca para outra voz

#### 🎮 Entretenimento
- `"contar piada"` - Conta uma piada aleatória

#### 📱 Aplicativos
- `"abrir calculadora"` - Abre a calculadora do sistema
- `"abrir bloco de notas"` - Abre o editor de texto
- `"abrir configurações"` - Abre as configurações do sistema
- `"abrir câmera"` - Abre a câmera (em desenvolvimento)

#### 📚 Histórico
- `"histórico"` - Mostra o histórico de conversas
- `"limpar histórico"` - Limpa o histórico

#### ❓ Ajuda
- `"ajuda"` ou `"comandos disponíveis"` - Lista todos os comandos

## 🚀 Configuração

### Pré-requisitos
- Navegador moderno (Chrome, Edge, Firefox, Safari)
- Servidor local (Python, Node.js, ou similar)
- Chave API da OpenAI (opcional, para funcionalidades de IA)

### Instalação

1. **Clone o repositório:**
```bash
git clone https://github.com/seu-usuario/Assistant.git
cd Assistant
```

2. **Configure a chave API:**
   - Renomeie o arquivo `config.example.js` para `config.js`
   - Substitua `"SUA_CHAVE_API_AQUI"` pela sua chave API da OpenAI
   - ⚠️ **IMPORTANTE**: Nunca compartilhe sua chave API publicamente

3. **Inicie um servidor local:**

**Com Python:**
```bash
python -m http.server 8000
```

**Com Node.js:**
```bash
npx http-server -p 8000
```

**Com PHP:**
```bash
php -S localhost:8000
```

4. **Acesse a aplicação:**
   - Abra `http://localhost:8000` no seu navegador
   - Permita o acesso ao microfone quando solicitado
   - Comece a falar!

## 📁 Estrutura do Projeto

```
Assistant/
├── app.js                 # Aplicação principal
├── config.example.js      # Exemplo de configuração
├── index.html             # Página principal
├── style.css              # Estilos
├── js/
│   ├── config/
│   │   └── constants.js   # Constantes do sistema
│   ├── services/
│   │   ├── speech.js      # Serviço de síntese de voz
│   │   ├── recognition.js # Serviço de reconhecimento de voz
│   │   ├── openai.js      # Serviço de integração OpenAI
│   │   └── ui.js          # Serviço de interface
│   ├── commands/
│   │   └── index.js       # Gerenciador de comandos
│   └── utils/
│       ├── storage.js     # Gerenciamento de localStorage
│       ├── history.js     # Gerenciamento de histórico
│       └── os.js          # Utilitários de sistema
└── README.md              # Este arquivo
```

## 🛠️ Tecnologias Utilizadas

- **HTML5** - Estrutura semântica
- **CSS3** - Estilização moderna com variáveis CSS
- **JavaScript ES6+** - Lógica da aplicação
- **Web Speech API** - Reconhecimento e síntese de voz
- **OpenAI API** - Inteligência artificial
- **TensorFlow.js** - Detecção de gestos (futuro)
- **LocalStorage API** - Persistência de dados

## 🎯 Melhorias Implementadas

### Versão 2.0

#### 🏗️ Arquitetura
- ✅ **Modularização completa** do código
- ✅ **Separação de responsabilidades** (MVC-like)
- ✅ **Código limpo e manutenível**
- ✅ **Documentação JSDoc** completa

#### 💾 Persistência
- ✅ **Histórico de conversas** com localStorage
- ✅ **Configurações persistentes** (tema, preferências)
- ✅ **Exportação de histórico** (futuro)

#### 🎨 Interface
- ✅ **Design moderno** com gradientes e animações
- ✅ **Modo escuro/claro** com transições suaves
- ✅ **Responsividade** aprimorada
- ✅ **Feedback visual** melhorado

#### ⚡ Performance
- ✅ **Lazy loading** de bibliotecas pesadas
- ✅ **Otimização de requisições**
- ✅ **Cache inteligente**

#### 🔒 Segurança
- ✅ **Validação de inputs**
- ✅ **Tratamento de erros** robusto
- ✅ **Proteção de dados** sensíveis

## 📝 Notas de Desenvolvimento

### Funcionalidades Futuras
- [ ] Detecção de gestos com câmera
- [ ] Suporte a múltiplos idiomas
- [ ] Sistema de plugins
- [ ] Integração com mais serviços
- [ ] Modo offline
- [ ] PWA (Progressive Web App)

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abrir um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## ⚠️ Avisos Importantes

1. **Chave API**: Nunca compartilhe sua chave API da OpenAI publicamente
2. **Microfone**: O aplicativo requer permissão de microfone para funcionar
3. **Navegador**: Funciona melhor no Google Chrome ou Microsoft Edge
4. **HTTPS**: Algumas funcionalidades podem requerer HTTPS em produção

## 📞 Suporte

Se você encontrar algum problema ou tiver sugestões, por favor:
- Abra uma [issue](https://github.com/seu-usuario/Assistant/issues)
- Entre em contato através do email

## 🙏 Agradecimentos

- OpenAI pela API incrível
- Comunidade open source pelas bibliotecas utilizadas
- Todos os contribuidores do projeto

---

**Desenvolvido com ❤️ para facilitar sua vida!**
