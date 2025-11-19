import { StorageManager } from '../utils/storage.js';
import { STORAGE_KEYS } from '../config/constants.js';
import { ContentRenderer } from '../utils/renderer.js';

/**
 * Serviço de interface do usuário
 */
export class UIService {
    constructor() {
        this.talkContainer = document.querySelector('.talk.input');
        this.content = document.querySelector('.content');
        this.micBtn = document.querySelector('.mic-btn');
        this.responseContainer = document.querySelector('#response-container');
        this.responseContent = document.querySelector('#response-content');
        this.closeResponseBtn = document.querySelector('#close-response');
        this.timerInterval = null;
        this.timerStartTime = null;
        this.init();
    }

    init() {
        // Carrega tema salvo
        const savedTheme = StorageManager.get(STORAGE_KEYS.THEME, 'light');
        this.setTheme(savedTheme);
        
        // Configura botão de fechar resposta
        if (this.closeResponseBtn) {
            this.closeResponseBtn.addEventListener('click', () => {
                this.hideResponse();
            });
        }
    }

    /**
     * Atualiza o conteúdo exibido
     * @param {string} text
     */
    updateContent(text) {
        if (this.content) {
            this.content.textContent = text;
        }
    }

    /**
     * Mostra resposta rica formatada
     * @param {string} text - Texto da resposta
     */
    showRichResponse(text) {
        if (!this.responseContainer || !this.responseContent) return;

        // Renderiza o conteúdo
        ContentRenderer.renderResponse(text, this.responseContent);

        // Mostra o container com animação
        this.responseContainer.style.display = 'block';
        setTimeout(() => {
            this.responseContainer.classList.add('visible');
        }, 10);

        // Scroll suave para a resposta
        setTimeout(() => {
            this.responseContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }

    /**
     * Esconde a resposta rica
     */
    hideResponse() {
        if (!this.responseContainer) return;
        
        this.responseContainer.classList.remove('visible');
        setTimeout(() => {
            this.responseContainer.style.display = 'none';
        }, 300);
    }

    /**
     * Atualiza resposta rica (para atualizações em tempo real)
     * @param {string} text
     */
    updateRichResponse(text) {
        if (this.responseContent) {
            ContentRenderer.renderResponse(text, this.responseContent);
        }
    }

    /**
     * Define o estado de escuta
     * @param {boolean} listening
     */
    setListening(listening) {
        if (this.talkContainer) {
            if (listening) {
                this.talkContainer.classList.add('listening');
                this.updateContent('Estou escutando...');
            } else {
                this.talkContainer.classList.remove('listening');
                this.updateContent('Clique para falar');
            }
        }
    }

    /**
     * Define o tema
     * @param {string} theme - 'dark' ou 'light'
     */
    setTheme(theme) {
        const isDark = theme === 'dark';
        
        // Aplica classe no body para CSS
        if (isDark) {
            document.body.classList.add('dark-mode');
            document.querySelector('.main')?.classList.add('dark');
        } else {
            document.body.classList.remove('dark-mode');
            document.querySelector('.main')?.classList.remove('dark');
        }

        // Salva o tema
        StorageManager.save(STORAGE_KEYS.THEME, theme);
    }

    /**
     * Inicia o cronômetro
     */
    startTimer() {
        this.stopTimer();
        
        this.timerStartTime = Date.now();
        let timeSpan = this.micBtn?.querySelector('.timer');
        
        if (!timeSpan && this.micBtn) {
            timeSpan = document.createElement('span');
            timeSpan.className = 'timer';
            this.micBtn.appendChild(timeSpan);
        }
        
        this.timerInterval = setInterval(() => {
            if (!timeSpan) return;
            
            const elapsed = Math.floor((Date.now() - this.timerStartTime) / 1000);
            const hours = Math.floor(elapsed / 3600);
            const minutes = Math.floor((elapsed % 3600) / 60);
            const seconds = elapsed % 60;
            
            const formatarTempo = (valor) => valor.toString().padStart(2, '0');
            const tempoFormatado = `${formatarTempo(hours)}:${formatarTempo(minutes)}:${formatarTempo(seconds)}`;
            
            timeSpan.textContent = tempoFormatado;
        }, 1000);
    }

    /**
     * Para o cronômetro
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        const timeSpan = this.micBtn?.querySelector('.timer');
        if (timeSpan) {
            timeSpan.remove();
        }
        
        this.timerStartTime = null;
    }

    /**
     * Mostra uma notificação
     * @param {string} title
     * @param {string} body
     */
    showNotification(title, body) {
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(title, { body });
        }
    }

    /**
     * Solicita permissão para notificações
     */
    async requestNotificationPermission() {
        if ("Notification" in window && Notification.permission === "default") {
            await Notification.requestPermission();
        }
    }

    /**
     * Mostra a interface de câmera para identificação de objetos
     * @param {CameraService} cameraService
     * @param {OpenAIService} openAIService
     * @param {SpeechService} speechService
     * @param {boolean} shouldSpeak
     */
    showCameraInterface(cameraService, openAIService, speechService, shouldSpeak) {
        // Remove interface anterior se existir
        const existingInterface = document.querySelector('#camera-interface');
        if (existingInterface) {
            existingInterface.remove();
        }

        // Cria a interface de câmera
        const cameraInterface = document.createElement('div');
        cameraInterface.id = 'camera-interface';
        cameraInterface.className = 'camera-interface';
        cameraInterface.innerHTML = `
            <div class="camera-modal">
                <div class="camera-header">
                    <h3><i class="fas fa-camera"></i> Identificação de Objetos com IA</h3>
                    <button class="camera-close" id="camera-close" aria-label="Fechar câmera">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="camera-content">
                    <div class="camera-preview-container" id="camera-preview-container">
                        <video id="camera-video" autoplay playsinline></video>
                        <canvas id="camera-captured-image" style="display: none;"></canvas>
                        <div class="camera-selection-overlay" id="camera-selection-overlay" style="display: none;">
                            <div class="selection-box" id="selection-box"></div>
                            <div class="selection-hint">
                                <i class="fas fa-mouse"></i> Arraste para selecionar uma região
                            </div>
                        </div>
                        <div class="camera-overlay">
                            <div class="camera-status" id="camera-status">Iniciando câmera...</div>
                        </div>
                    </div>
                    <div class="camera-controls">
                        <button id="camera-capture" class="camera-btn capture-btn" disabled>
                            <i class="fas fa-camera"></i>
                            <span>Capturar Imagem</span>
                        </button>
                        <button id="camera-analyze-selection" class="camera-btn analyze-btn" style="display: none;" disabled>
                            <i class="fas fa-search"></i>
                            <span>Analisar Região Selecionada</span>
                        </button>
                        <button id="camera-analyze-full" class="camera-btn analyze-btn" style="display: none;">
                            <i class="fas fa-eye"></i>
                            <span>Analisar Imagem Completa</span>
                        </button>
                        <button id="camera-reset" class="camera-btn reset-btn" style="display: none;">
                            <i class="fas fa-redo"></i>
                            <span>Nova Captura</span>
                        </button>
                        <button id="camera-stop" class="camera-btn stop-btn">
                            <i class="fas fa-stop"></i>
                            <span>Fechar</span>
                        </button>
                    </div>
                    <div class="camera-result" id="camera-result" style="display: none;">
                        <h4><i class="fas fa-robot"></i> Análise da IA:</h4>
                        <div class="camera-result-content" id="camera-result-content"></div>
                    </div>
                </div>
            </div>
            <div class="camera-overlay-background" id="camera-overlay-bg"></div>
        `;

        document.body.appendChild(cameraInterface);

        // Elementos da interface
        const videoElement = document.getElementById('camera-video');
        const capturedImageCanvas = document.getElementById('camera-captured-image');
        const previewContainer = document.getElementById('camera-preview-container');
        const selectionOverlay = document.getElementById('camera-selection-overlay');
        const selectionBox = document.getElementById('selection-box');
        const captureBtn = document.getElementById('camera-capture');
        const analyzeSelectionBtn = document.getElementById('camera-analyze-selection');
        const analyzeFullBtn = document.getElementById('camera-analyze-full');
        const resetBtn = document.getElementById('camera-reset');
        const stopBtn = document.getElementById('camera-stop');
        const closeBtn = document.getElementById('camera-close');
        const overlayBg = document.getElementById('camera-overlay-bg');
        const statusDiv = document.getElementById('camera-status');
        const resultDiv = document.getElementById('camera-result');
        const resultContent = document.getElementById('camera-result-content');

        // Estado da seleção
        let isSelecting = false;
        let selectionStart = { x: 0, y: 0 };
        let currentSelection = null;
        let capturedImageBase64 = null;

        // Função para fechar a interface
        const closeCamera = () => {
            cameraService.stop();
            cameraInterface.remove();
        };

        // Event listeners
        closeBtn.addEventListener('click', closeCamera);
        stopBtn.addEventListener('click', closeCamera);
        overlayBg.addEventListener('click', closeCamera);

        // Inicia a câmera
        cameraService.start(videoElement)
            .then(() => {
                statusDiv.textContent = 'Câmera ativa - Aponte para um objeto';
                statusDiv.className = 'camera-status success';
                captureBtn.disabled = false;
            })
            .catch((error) => {
                statusDiv.textContent = error.message || 'Erro ao iniciar câmera';
                statusDiv.className = 'camera-status error';
                captureBtn.disabled = true;
                
                if (shouldSpeak) {
                    speechService.speak(error.message || 'Erro ao iniciar câmera');
                }
            });

        // Função para iniciar seleção de região
        const startSelection = (e) => {
            if (!capturedImageBase64) return;
            
            const rect = previewContainer.getBoundingClientRect();
            selectionStart = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            isSelecting = true;
            selectionOverlay.style.display = 'block';
            updateSelectionBox(e);
        };

        const updateSelectionBox = (e) => {
            if (!isSelecting) return;
            
            const rect = previewContainer.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            
            const x = Math.min(selectionStart.x, currentX);
            const y = Math.min(selectionStart.y, currentY);
            const width = Math.abs(currentX - selectionStart.x);
            const height = Math.abs(currentY - selectionStart.y);
            
            // Limita a seleção dentro do container
            const maxX = rect.width;
            const maxY = rect.height;
            
            currentSelection = {
                x: Math.max(0, Math.min(x, maxX - width)),
                y: Math.max(0, Math.min(y, maxY - height)),
                width: Math.min(width, maxX - x),
                height: Math.min(height, maxY - y)
            };
            
            if (currentSelection.width > 10 && currentSelection.height > 10) {
                selectionBox.style.left = currentSelection.x + 'px';
                selectionBox.style.top = currentSelection.y + 'px';
                selectionBox.style.width = currentSelection.width + 'px';
                selectionBox.style.height = currentSelection.height + 'px';
                analyzeSelectionBtn.disabled = false;
            } else {
                analyzeSelectionBtn.disabled = true;
            }
        };

        const endSelection = () => {
            isSelecting = false;
        };

        // Event listeners para seleção
        previewContainer.addEventListener('mousedown', startSelection);
        previewContainer.addEventListener('mousemove', updateSelectionBox);
        previewContainer.addEventListener('mouseup', endSelection);
        previewContainer.addEventListener('mouseleave', endSelection);

        // Captura a imagem
        captureBtn.addEventListener('click', async () => {
            if (cameraService.isActive) {
                try {
                    captureBtn.disabled = true;
                    statusDiv.textContent = 'Capturando imagem...';
                    statusDiv.className = 'camera-status processing';

                    // Captura a foto
                    const base64 = await cameraService.capturePhoto();
                    capturedImageBase64 = base64;

                    // Pausa o vídeo e mostra a imagem capturada (não para o stream)
                    videoElement.pause();
                    videoElement.style.display = 'none';
                    
                    // Desenha a imagem no canvas
                    const img = new Image();
                    img.onload = () => {
                        // Usa o tamanho real da imagem
                        capturedImageCanvas.width = img.width;
                        capturedImageCanvas.height = img.height;
                        const ctx = capturedImageCanvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        capturedImageCanvas.style.display = 'block';
                        
                        // Ajusta o tamanho do canvas para caber no container mantendo proporção
                        const containerWidth = previewContainer.clientWidth;
                        const containerHeight = previewContainer.clientHeight;
                        const scale = Math.min(
                            containerWidth / img.width,
                            containerHeight / img.height
                        );
                        capturedImageCanvas.style.width = (img.width * scale) + 'px';
                        capturedImageCanvas.style.height = (img.height * scale) + 'px';
                        capturedImageCanvas.style.objectFit = 'contain';
                    };
                    img.src = base64;

                    // Mostra botões de análise
                    captureBtn.style.display = 'none';
                    analyzeSelectionBtn.style.display = 'flex';
                    analyzeFullBtn.style.display = 'flex';
                    resetBtn.style.display = 'flex';
                    selectionOverlay.style.display = 'block';
                    
                    statusDiv.textContent = 'Imagem capturada! Selecione uma região ou analise a imagem completa.';
                    statusDiv.className = 'camera-status success';

                } catch (error) {
                    console.error('Erro ao capturar imagem:', error);
                    statusDiv.textContent = 'Erro ao capturar imagem.';
                    statusDiv.className = 'camera-status error';
                    captureBtn.disabled = false;
                }
            }
        });

        // Analisa região selecionada
        analyzeSelectionBtn.addEventListener('click', async () => {
            if (!capturedImageBase64 || !currentSelection) return;
            
            try {
                analyzeSelectionBtn.disabled = true;
                analyzeFullBtn.disabled = true;
                statusDiv.textContent = 'Analisando região selecionada...';
                statusDiv.className = 'camera-status processing';

                // Obtém tamanhos
                const displaySize = {
                    width: capturedImageCanvas.clientWidth,
                    height: capturedImageCanvas.clientHeight
                };
                const imageSize = {
                    width: capturedImageCanvas.width,
                    height: capturedImageCanvas.height
                };

                // Recorta a região selecionada
                const croppedBase64 = await cameraService.cropImage(
                    capturedImageBase64,
                    currentSelection,
                    displaySize,
                    imageSize,
                    0.9
                );
                const imageBase64 = cameraService.base64ToApiFormat(croppedBase64);

                // Analisa com a IA focando no objeto selecionado
                const analysis = await openAIService.analyzeImage(
                    imageBase64,
                    'Analise APENAS o objeto ou região visível nesta imagem. Foque especificamente neste objeto e forneça uma descrição detalhada: o que é, suas características (cor, forma, tamanho, material), sua função ou propósito, e qualquer detalhe relevante. Ignore tudo que está fora desta região.'
                );

                // Mostra resultado
                resultDiv.style.display = 'block';
                ContentRenderer.renderResponse(analysis, resultContent);
                
                statusDiv.textContent = 'Análise da região concluída!';
                statusDiv.className = 'camera-status success';

                // Fala o resultado se habilitado
                if (shouldSpeak) {
                    const shortAnalysis = analysis.length > 200 
                        ? analysis.substring(0, 200) + '...' 
                        : analysis;
                    await speechService.speak(shortAnalysis);
                }

                // Scroll para o resultado
                setTimeout(() => {
                    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);

            } catch (error) {
                console.error('Erro ao analisar região:', error);
                statusDiv.textContent = 'Erro ao analisar região. Verifique sua chave API.';
                statusDiv.className = 'camera-status error';
                
                if (shouldSpeak) {
                    speechService.speak('Erro ao analisar região. Verifique sua chave API da OpenAI.');
                }
            } finally {
                analyzeSelectionBtn.disabled = false;
                analyzeFullBtn.disabled = false;
            }
        });

        // Analisa imagem completa
        analyzeFullBtn.addEventListener('click', async () => {
            if (!capturedImageBase64) return;
            
            try {
                analyzeSelectionBtn.disabled = true;
                analyzeFullBtn.disabled = true;
                statusDiv.textContent = 'Analisando imagem completa...';
                statusDiv.className = 'camera-status processing';

                const imageBase64 = cameraService.base64ToApiFormat(capturedImageBase64);
                
                // Analisa com a IA
                const analysis = await openAIService.analyzeImage(
                    imageBase64,
                    'Identifique e descreva todos os objetos visíveis nesta imagem. Liste os objetos encontrados de forma clara e organizada, e forneça uma descrição detalhada do que você vê. Seja específico sobre cores, formas, tamanhos e posições dos objetos.'
                );

                // Mostra resultado
                resultDiv.style.display = 'block';
                ContentRenderer.renderResponse(analysis, resultContent);
                
                statusDiv.textContent = 'Análise concluída!';
                statusDiv.className = 'camera-status success';

                // Fala o resultado se habilitado
                if (shouldSpeak) {
                    const shortAnalysis = analysis.length > 200 
                        ? analysis.substring(0, 200) + '...' 
                        : analysis;
                    await speechService.speak(shortAnalysis);
                }

                // Scroll para o resultado
                setTimeout(() => {
                    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);

            } catch (error) {
                console.error('Erro ao analisar imagem:', error);
                statusDiv.textContent = 'Erro ao analisar imagem. Verifique sua chave API.';
                statusDiv.className = 'camera-status error';
                
                if (shouldSpeak) {
                    speechService.speak('Erro ao analisar imagem. Verifique sua chave API da OpenAI.');
                }
            } finally {
                analyzeSelectionBtn.disabled = false;
                analyzeFullBtn.disabled = false;
            }
        });

        // Reset para nova captura
        resetBtn.addEventListener('click', () => {
            capturedImageBase64 = null;
            currentSelection = null;
            isSelecting = false;
            
            // Limpa o canvas
            const ctx = capturedImageCanvas.getContext('2d');
            ctx.clearRect(0, 0, capturedImageCanvas.width, capturedImageCanvas.height);
            
            videoElement.style.display = 'block';
            capturedImageCanvas.style.display = 'none';
            selectionOverlay.style.display = 'none';
            selectionBox.style.width = '0px';
            selectionBox.style.height = '0px';
            captureBtn.style.display = 'flex';
            analyzeSelectionBtn.style.display = 'none';
            analyzeFullBtn.style.display = 'none';
            resetBtn.style.display = 'none';
            resultDiv.style.display = 'none';
            captureBtn.disabled = false;
            analyzeSelectionBtn.disabled = true;
            
            // Reinicia a câmera
            videoElement.play();
            cameraService.start(videoElement)
                .then(() => {
                    statusDiv.textContent = 'Câmera ativa - Aponte para um objeto';
                    statusDiv.className = 'camera-status success';
                })
                .catch((error) => {
                    statusDiv.textContent = error.message || 'Erro ao reiniciar câmera';
                    statusDiv.className = 'camera-status error';
                });
        });

        // Fecha com ESC
        const handleEsc = (e) => {
            if (e.key === 'Escape' && cameraInterface.parentNode) {
                closeCamera();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }
}

