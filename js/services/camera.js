/**
 * Serviço de câmera para captura e análise de imagens
 */
export class CameraService {
    constructor() {
        this.stream = null;
        this.videoElement = null;
        this.isActive = false;
    }

    /**
     * Verifica se a câmera está disponível
     * @returns {Promise<boolean>}
     */
    async isAvailable() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.some(device => device.kind === 'videoinput');
        } catch (error) {
            console.error('Erro ao verificar disponibilidade da câmera:', error);
            return false;
        }
    }

    /**
     * Solicita permissão e inicia a câmera
     * @param {HTMLVideoElement} videoElement - Elemento de vídeo para exibir a câmera
     * @returns {Promise<void>}
     */
    async start(videoElement) {
        try {
            if (!videoElement) {
                throw new Error('Elemento de vídeo não fornecido');
            }

            this.videoElement = videoElement;

            // Solicita acesso à câmera
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Câmera traseira em dispositivos móveis
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            // Conecta o stream ao elemento de vídeo
            videoElement.srcObject = this.stream;
            videoElement.play();
            this.isActive = true;

            return Promise.resolve();
        } catch (error) {
            console.error('Erro ao iniciar câmera:', error);
            this.isActive = false;
            
            let errorMessage = 'Erro ao acessar a câmera.';
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage = 'Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador.';
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage = 'Nenhuma câmera encontrada no dispositivo.';
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage = 'A câmera está sendo usada por outro aplicativo.';
            }
            
            throw new Error(errorMessage);
        }
    }

    /**
     * Para a câmera e libera recursos
     */
    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.videoElement) {
            this.videoElement.srcObject = null;
            this.videoElement = null;
        }

        this.isActive = false;
    }

    /**
     * Captura uma foto do vídeo atual
     * @param {number} quality - Qualidade da imagem (0-1)
     * @returns {Promise<string>} - Base64 da imagem
     */
    async capturePhoto(quality = 0.8) {
        if (!this.videoElement || !this.isActive) {
            throw new Error('Câmera não está ativa');
        }

        try {
            const canvas = document.createElement('canvas');
            canvas.width = this.videoElement.videoWidth;
            canvas.height = this.videoElement.videoHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(this.videoElement, 0, 0);

            // Converte para base64
            const base64 = canvas.toDataURL('image/jpeg', quality);
            return base64;
        } catch (error) {
            console.error('Erro ao capturar foto:', error);
            throw new Error('Erro ao capturar foto');
        }
    }

    /**
     * Recorta uma região de uma imagem base64
     * @param {string} imageBase64 - Imagem em base64
     * @param {Object} cropRegion - Região para recortar {x, y, width, height}
     * @param {Object} displaySize - Tamanho de exibição {width, height}
     * @param {Object} imageSize - Tamanho real da imagem {width, height}
     * @param {number} quality - Qualidade da imagem (0-1)
     * @returns {Promise<string>} - Base64 da imagem recortada
     */
    async cropImage(imageBase64, cropRegion, displaySize, imageSize, quality = 0.9) {
        return new Promise((resolve, reject) => {
            try {
                const img = new Image();
                img.onload = () => {
                    // Calcula as proporções entre a imagem exibida e a imagem real
                    const scaleX = imageSize.width / displaySize.width;
                    const scaleY = imageSize.height / displaySize.height;

                    // Ajusta as coordenadas da região selecionada para o tamanho real da imagem
                    const cropX = cropRegion.x * scaleX;
                    const cropY = cropRegion.y * scaleY;
                    const cropWidth = cropRegion.width * scaleX;
                    const cropHeight = cropRegion.height * scaleY;

                    // Garante que a região está dentro dos limites da imagem
                    const finalX = Math.max(0, Math.min(cropX, img.width - 1));
                    const finalY = Math.max(0, Math.min(cropY, img.height - 1));
                    const finalWidth = Math.min(cropWidth, img.width - finalX);
                    const finalHeight = Math.min(cropHeight, img.height - finalY);

                    const canvas = document.createElement('canvas');
                    canvas.width = finalWidth;
                    canvas.height = finalHeight;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(
                        img,
                        finalX, finalY, finalWidth, finalHeight,
                        0, 0, finalWidth, finalHeight
                    );

                    const base64 = canvas.toDataURL('image/jpeg', quality);
                    resolve(base64);
                };
                img.onerror = () => reject(new Error('Erro ao carregar imagem'));
                img.src = imageBase64;
            } catch (error) {
                reject(new Error('Erro ao recortar imagem'));
            }
        });
    }

    /**
     * Converte base64 para formato necessário para API (remove data:image/jpeg;base64,)
     * @param {string} base64 - String base64 completa
     * @returns {string} - Base64 sem prefixo
     */
    base64ToApiFormat(base64) {
        return base64.split(',')[1];
    }
}

