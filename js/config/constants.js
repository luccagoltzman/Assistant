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
    TIME: ['que horas são', 'horas', 'hora'],
    DATE: ['que dia é hoje', 'data', 'dia'],
    MUSIC: ['tocar música', 'música', 'music'],
    WEATHER: ['previsão do tempo', 'tempo', 'clima'],
    JOKE: ['contar piada', 'piada'],
    DARK_MODE: ['modo escuro', 'dark mode'],
    LIGHT_MODE: ['modo claro', 'light mode', 'modo claro'],
    CALCULATE: ['calcular', 'calcule'],
    TIMER: ['cronômetro', 'timer'],
    TRANSLATE: ['traduzir', 'traduza'],
    REMINDER: ['criar lembrete', 'lembrete'],
    VOLUME_UP: ['aumentar volume', 'volume up'],
    VOLUME_DOWN: ['diminuir volume', 'volume down'],
    LIST_VOICES: ['listar vozes', 'vozes'],
    CHANGE_VOICE: ['trocar voz', 'mudar voz'],
    CALCULATOR: ['abrir calculadora', 'calculadora'],
    NOTEPAD: ['abrir bloco de notas', 'bloco de notas'],
    CAMERA: ['abrir câmera', 'câmera'],
    SETTINGS: ['abrir configurações', 'configurações'],
};

export const STORAGE_KEYS = {
    HISTORY: 'cangalha_history',
    SETTINGS: 'cangalha_settings',
    THEME: 'cangalha_theme',
};

export const API_CONFIG = {
    MAX_TOKENS: 2048,
    TEMPERATURE: 1,
    MODEL: 'gpt-3.5-turbo',
};

