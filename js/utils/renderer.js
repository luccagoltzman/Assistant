/**
 * Utilitário para renderização rica de conteúdo
 */
export class ContentRenderer {
    /**
     * Renderiza texto com formatação markdown básica
     * @param {string} text - Texto a ser renderizado
     * @returns {string} - HTML renderizado
     */
    static renderMarkdown(text) {
        if (!text) return '';

        let html = text;

        // Processa markdown primeiro, depois escapa o que não foi processado
        
        // Blocos de código - ```código``` (antes de outras transformações)
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        // Código inline - `código` (mas não dentro de blocos)
        html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

        // Links - formato [texto](url)
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="response-link"><i class="fas fa-external-link-alt"></i> $1</a>');

        // URLs diretas
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        html = html.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="response-link"><i class="fas fa-external-link-alt"></i> $1</a>');

        // Negrito - **texto** ou __texto__
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

        // Itálico - *texto* ou _texto_
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

        // Imagens - formato ![alt](url)
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="response-image" loading="lazy" onerror="this.style.display=\'none\'">');

        // Títulos - # Título (antes de outras transformações)
        html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

        // Listas não ordenadas - linhas começando com - ou *
        html = html.replace(/^[\s]*[-*]\s+(.+)$/gm, '<li>$1</li>');
        // Agrupa itens de lista consecutivos
        html = html.replace(/(<li>.*?<\/li>)(?=\s*<li>|$)/gs, function(match) {
            if (!match.includes('<ul>')) {
                return '<ul>' + match + '</ul>';
            }
            return match;
        });

        // Listas ordenadas - linhas começando com número
        html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
        // Agrupa itens de lista ordenada consecutivos
        html = html.replace(/(<li>.*?<\/li>)(?=\s*<li>|$)/gs, function(match) {
            if (!match.includes('<ol>') && !match.includes('<ul>')) {
                return '<ol>' + match + '</ol>';
            }
            return match;
        });

        // Escape HTML básico para texto não processado
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        html = tempDiv.innerHTML;

        // Quebras de linha
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');
        
        // Envolve em parágrafos se necessário
        if (!html.trim().startsWith('<')) {
            html = '<p>' + html + '</p>';
        }

        return html;
    }

    /**
     * Extrai links do texto
     * @param {string} text
     * @returns {Array} Array de objetos {url, text}
     */
    static extractLinks(text) {
        const links = [];
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const markdownRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

        let match;
        while ((match = urlRegex.exec(text)) !== null) {
            links.push({ url: match[1], text: match[1] });
        }

        while ((match = markdownRegex.exec(text)) !== null) {
            links.push({ url: match[2], text: match[1] });
        }

        return links;
    }

    /**
     * Extrai imagens do texto
     * @param {string} text
     * @returns {Array} Array de URLs de imagens
     */
    static extractImages(text) {
        const images = [];
        const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        const urlImgRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg))/gi;

        let match;
        while ((match = imgRegex.exec(text)) !== null) {
            images.push({ url: match[2], alt: match[1] });
        }

        while ((match = urlImgRegex.exec(text)) !== null) {
            images.push({ url: match[1], alt: 'Imagem' });
        }

        return images;
    }

    /**
     * Renderiza resposta completa com formatação rica
     * @param {string} text - Texto da resposta
     * @param {HTMLElement} container - Container onde renderizar
     */
    static renderResponse(text, container) {
        if (!container) return;

        // Limpa o container
        container.innerHTML = '';

        // Renderiza o conteúdo principal
        const contentDiv = document.createElement('div');
        contentDiv.className = 'response-text';
        contentDiv.innerHTML = this.renderMarkdown(text);
        container.appendChild(contentDiv);

        // Extrai e exibe links separadamente
        const links = this.extractLinks(text);
        if (links.length > 0) {
            const linksDiv = document.createElement('div');
            linksDiv.className = 'response-links';
            linksDiv.innerHTML = '<h4><i class="fas fa-link"></i> Links Relacionados:</h4><ul>';
            
            links.forEach(link => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="response-link"><i class="fas fa-external-link-alt"></i> ${link.text}</a>`;
                linksDiv.querySelector('ul').appendChild(li);
            });
            
            linksDiv.innerHTML += '</ul>';
            container.appendChild(linksDiv);
        }

        // Extrai e exibe imagens separadamente
        const images = this.extractImages(text);
        if (images.length > 0) {
            const imagesDiv = document.createElement('div');
            imagesDiv.className = 'response-images';
            imagesDiv.innerHTML = '<h4><i class="fas fa-image"></i> Imagens:</h4>';
            
            images.forEach(img => {
                const imgElement = document.createElement('img');
                imgElement.src = img.url;
                imgElement.alt = img.alt;
                imgElement.className = 'response-image';
                imgElement.loading = 'lazy';
                imgElement.onerror = function() {
                    this.style.display = 'none';
                };
                imagesDiv.appendChild(imgElement);
            });
            
            container.appendChild(imagesDiv);
        }
    }
}

