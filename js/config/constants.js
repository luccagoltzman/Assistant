/**
 * Constantes do sistema
 */
export const VOICE_OPTIONS = [
    'Microsoft Daniel - Portuguese (Brazil)',
    'Microsoft Maria - Portuguese (Brazil)',
    'Google português do Brasil',
    'Portuguese (Brazil)',
];

export const VOICE_SETTINGS = {
    pitch: 1.0,
    rate: 1.1,
    volume: 1.0,
};

export const COMMANDS = {
    HELP: ['ajuda', 'comandos disponíveis', 'help'],
    OPEN_YOUTUBE: ['abrir youtube', 'youtube'],
    OPEN_GOOGLE: ['abrir google', 'google'],
    OPEN_LINKEDIN: ['abrir linkedin', 'linkedin'],
    OPEN_FACEBOOK: ['abrir facebook', 'facebook'],
    OPEN_INSTAGRAM: ['abrir instagram', 'instagram'],
    OPEN_TWITTER: ['abrir twitter', 'twitter'],
    SEARCH_GOOGLE: ['pesquisar no google', 'pesquisar google'],
    SEARCH_WIKIPEDIA: ['pesquisar na wikipedia', 'wikipedia'],
    TIME: ['que horas são', 'que hora são', 'que horas', 'horas são'],
    DATE: ['que dia é hoje', 'que dia é', 'qual a data de hoje', 'qual é a data'],
    MUSIC: ['tocar música', 'tocar music', 'abrir música', 'abrir music'],
    WEATHER: ['previsão do tempo', 'abrir previsão', 'abrir clima'],
    JOKE: ['contar piada', 'me conte uma piada', 'quero ouvir uma piada'],
    DARK_MODE: ['modo escuro', 'ativar modo escuro', 'dark mode'],
    LIGHT_MODE: ['modo claro', 'ativar modo claro', 'light mode'],
    CALCULATE: ['calcular', 'calcule', 'faça o cálculo'],
    TIMER: ['cronômetro', 'iniciar cronômetro', 'timer'],
    TRANSLATE: ['traduzir', 'traduza', 'traduzir texto'],
    REMINDER: ['criar lembrete', 'novo lembrete', 'adicionar lembrete'],
    VOLUME_UP: ['aumentar volume', 'volume up', 'subir volume'],
    VOLUME_DOWN: ['diminuir volume', 'volume down', 'baixar volume'],
    LIST_VOICES: ['listar vozes', 'mostrar vozes', 'vozes disponíveis'],
    CHANGE_VOICE: ['trocar voz', 'mudar voz', 'alterar voz'],
    CALCULATOR: ['abrir calculadora', 'abrir a calculadora'],
    NOTEPAD: ['abrir bloco de notas', 'abrir bloco'],
    CAMERA: ['abrir câmera', 'abrir a câmera'],
    SETTINGS: ['abrir configurações', 'abrir as configurações'],
};

export const STORAGE_KEYS = {
    HISTORY: 'assistent_multinegocios_history',
    SETTINGS: 'assistent_multinegocios_settings',
    THEME: 'assistent_multinegocios_theme',
};

export const API_CONFIG = {
    MAX_TOKENS: 2048,
    TEMPERATURE: 1,
    MODEL: 'gpt-3.5-turbo',
};

