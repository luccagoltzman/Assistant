/**
 * Serviço de busca na web para informações em tempo real
 */
export class WebSearchService {
    /**
     * Busca informações na web usando DuckDuckGo Instant Answer API
     * @param {string} query - Termo de busca
     * @returns {Promise<string>} - Resumo da busca
     */
    async searchDuckDuckGo(query) {
        // Tenta múltiplos proxies em sequência
        const proxies = [
            'https://api.allorigins.win',
            'https://corsproxy.io/?',
            'https://api.codetabs.com/v1/proxy?quest='
        ];
        
        const targetUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
        
        for (const proxyBase of proxies) {
            try {
                let proxyUrl;
                if (proxyBase.includes('allorigins')) {
                    proxyUrl = `${proxyBase}/get?url=${encodeURIComponent(targetUrl)}`;
                } else if (proxyBase.includes('codetabs')) {
                    proxyUrl = `${proxyBase}${encodeURIComponent(targetUrl)}`;
                } else {
                    proxyUrl = `${proxyBase}${targetUrl}`;
                }
                
                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    continue; // Tenta próximo proxy
                }

                let data;
                if (proxyBase.includes('allorigins')) {
                    const proxyData = await response.json();
                    if (!proxyData.contents) {
                        continue;
                    }
                    data = JSON.parse(proxyData.contents);
                } else {
                    data = await response.json();
                }
                
                // Retorna AbstractText se disponível
                if (data.AbstractText && data.AbstractText.trim().length > 10) {
                    return data.AbstractText.trim();
                }
                
                // Retorna Answer se disponível
                if (data.Answer && data.Answer.trim().length > 10) {
                    return data.Answer.trim();
                }
                
                // Retorna RelatedTopics se disponível
                if (data.RelatedTopics && data.RelatedTopics.length > 0) {
                    const firstTopic = data.RelatedTopics[0];
                    if (firstTopic.Text && firstTopic.Text.trim().length > 10) {
                        return firstTopic.Text.trim();
                    }
                }
                
                // Retorna Definition se disponível
                if (data.Definition && data.Definition.trim().length > 10) {
                    return data.Definition.trim();
                }
                
                // Se chegou aqui, encontrou dados mas não úteis, tenta próximo proxy
                continue;
            } catch (error) {
                console.warn(`Erro com proxy ${proxyBase}:`, error.message);
                continue; // Tenta próximo proxy
            }
        }
        
        return null;
    }

    /**
     * Busca notícias usando NewsAPI (requer API key, mas tem plano gratuito)
     * @param {string} query - Termo de busca
     * @param {string} apiKey - Chave API do NewsAPI (opcional)
     * @returns {Promise<Array>} - Array de notícias
     */
    async searchNews(query, apiKey = null) {
        if (!apiKey) {
            // Tenta usar API pública alternativa
            return this.searchNewsAlternative(query);
        }

        try {
            const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=pt&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Erro na busca de notícias');
            }

            const data = await response.json();
            
            if (data.articles && data.articles.length > 0) {
                return data.articles.map(article => ({
                    title: article.title,
                    description: article.description,
                    url: article.url,
                    publishedAt: article.publishedAt
                }));
            }
            
            return [];
        } catch (error) {
            console.error('Erro na busca de notícias:', error);
            return [];
        }
    }

    /**
     * Busca alternativa de notícias usando RSS feeds públicos
     * @param {string} query - Termo de busca
     * @returns {Promise<Array>} - Array de notícias
     */
    async searchNewsAlternative(query) {
        // Tenta múltiplos proxies e fontes
        const proxies = [
            'https://api.allorigins.win',
            'https://corsproxy.io/?',
            'https://api.codetabs.com/v1/proxy?quest='
        ];
        
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
        
        for (const proxyBase of proxies) {
            try {
                let proxyUrl;
                if (proxyBase.includes('allorigins')) {
                    proxyUrl = `${proxyBase}/get?url=${encodeURIComponent(rssUrl)}`;
                } else if (proxyBase.includes('codetabs')) {
                    proxyUrl = `${proxyBase}${encodeURIComponent(rssUrl)}`;
                } else {
                    proxyUrl = `${proxyBase}${rssUrl}`;
                }
                
                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/xml, text/xml, */*'
                    }
                });
                
                if (!response.ok) {
                    continue; // Tenta próximo proxy
                }

                let text;
                if (proxyBase.includes('allorigins')) {
                    const proxyData = await response.json();
                    if (!proxyData.contents) {
                        continue;
                    }
                    text = proxyData.contents;
                } else {
                    text = await response.text();
                }
                
                const parser = new DOMParser();
                const xml = parser.parseFromString(text, 'text/xml');
                
                // Verifica se há erros no parsing
                const parseError = xml.querySelector('parsererror');
                if (parseError) {
                    continue; // Tenta próximo proxy
                }
                
                const items = xml.querySelectorAll('item');
                const news = [];
                
                items.forEach((item, index) => {
                    if (index < 5) { // Limita a 5 notícias
                        const title = item.querySelector('title')?.textContent || '';
                        const description = item.querySelector('description')?.textContent || '';
                        const link = item.querySelector('link')?.textContent || '';
                        const pubDate = item.querySelector('pubDate')?.textContent || '';
                        
                        if (title && title.trim().length > 0) {
                            news.push({
                                title: title.replace(/<[^>]*>/g, '').trim(), // Remove HTML
                                description: description ? description.replace(/<[^>]*>/g, '').trim() : '',
                                url: link || '',
                                publishedAt: pubDate || ''
                            });
                        }
                    }
                });
                
                if (news.length > 0) {
                    return news;
                }
                
                // Se chegou aqui mas não encontrou notícias, tenta próximo proxy
                continue;
            } catch (error) {
                console.warn(`Erro com proxy ${proxyBase} para notícias:`, error.message);
                continue; // Tenta próximo proxy
            }
        }
        
        // Se todos os proxies falharam, retorna array vazio
        return [];
    }

    /**
     * Busca informações esportivas (F1, futebol, etc)
     * @param {string} sport - Esporte (ex: "F1", "futebol")
     * @param {string} query - Termo específico
     * @returns {Promise<string>} - Informações encontradas
     */
    async searchSports(sport, query) {
        try {
            // Busca em paralelo para melhor resultado
            const searchQuery = `${sport} ${query}`;
            
            // Usa Promise.allSettled para não falhar se uma fonte falhar
            const [ddgResult, newsResult] = await Promise.allSettled([
                this.searchDuckDuckGo(searchQuery),
                this.searchNewsAlternative(searchQuery)
            ]);
            
            const ddgResult_value = ddgResult.status === 'fulfilled' ? ddgResult.value : null;
            const news = newsResult.status === 'fulfilled' ? newsResult.value : [];
            
            // Combina resultados se ambos existirem
            let combinedResult = '';
            
            if (ddgResult_value && ddgResult_value.trim().length > 20) {
                combinedResult += `INFORMAÇÕES SOBRE ${sport.toUpperCase()}:\n${ddgResult_value}\n\n`;
            }
            
            if (news && Array.isArray(news) && news.length > 0) {
                combinedResult += `NOTÍCIAS RECENTES (${news.length} encontradas):\n\n`;
                combinedResult += news.map((n, i) => 
                    `${i + 1}. **${n.title}**\n   ${n.description ? n.description.substring(0, 200) : 'Sem descrição'}...\n   Fonte: ${n.url || 'N/A'}\n   Data: ${n.publishedAt || 'Recente'}`
                ).join('\n\n');
            }
            
            if (combinedResult.trim().length > 0) {
                return combinedResult.trim();
            }
            
            // Se só tem DuckDuckGo (mesmo que curto)
            if (ddgResult_value) {
                return ddgResult_value;
            }
            
            return null;
        } catch (error) {
            console.error('Erro na busca esportiva:', error);
            return null;
        }
    }

    /**
     * Busca informações gerais na web
     * @param {string} query - Termo de busca
     * @returns {Promise<string>} - Informações encontradas
     */
    async searchWeb(query) {
        try {
            // Tenta múltiplas fontes em paralelo para melhor resultado
            // Usa Promise.allSettled para não falhar se uma fonte falhar
            const [ddgResult, newsResult] = await Promise.allSettled([
                this.searchDuckDuckGo(query),
                this.searchNewsAlternative(query)
            ]);
            
            const ddgResult_value = ddgResult.status === 'fulfilled' ? ddgResult.value : null;
            const news = newsResult.status === 'fulfilled' ? newsResult.value : [];
            
            // Se encontrou no DuckDuckGo, usa isso
            if (ddgResult_value && ddgResult_value.trim().length > 20) {
                return ddgResult_value;
            }
            
            // Se encontrou notícias, formata e retorna
            if (news && Array.isArray(news) && news.length > 0) {
                const summary = news.map((n, i) => 
                    `${i + 1}. **${n.title}**\n   ${n.description ? n.description.substring(0, 200) : 'Sem descrição'}...\n   Fonte: ${n.url || 'N/A'}\n   Data: ${n.publishedAt || 'Recente'}`
                ).join('\n\n');
                
                return `INFORMAÇÕES RECENTES ENCONTRADAS SOBRE "${query}":\n\n${summary}\n\n[Use essas informações para responder a pergunta do usuário de forma atualizada e precisa.]`;
            }
            
            // Se encontrou algo no DuckDuckGo (mesmo que curto), retorna
            if (ddgResult_value) {
                return ddgResult_value;
            }
            
            return null;
        } catch (error) {
            console.error('Erro na busca web:', error);
            return null;
        }
    }
}

