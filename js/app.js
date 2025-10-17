class AvacoreDashboard {
    constructor() {
        this.data = null;
        console.log("🔄 AvacoreDashboard инициализирован");
        this.loadDataFromUrl();
    }

    loadDataFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const compressedData = urlParams.get('data');
        
        console.log("🔍 Параметры URL:", window.location.search);
        console.log("📦 Полученные данные:", compressedData ? `Длина: ${compressedData.length}` : 'Нет данных');
        
        if (!compressedData) {
            this.showError('Данные не найдены в URL. Пожалуйста, откройте веб-панель через бота командой /web');
            return;
        }
        
        try {
            console.log("🔄 Начинаем декомпрессию данных...");
            this.data = this.decompressData(compressedData);
            
            if (!this.data) {
                throw new Error('Неверный формат данных после декомпрессии');
            }
            
            console.log("✅ Данные успешно загружены:", this.data);
            this.hideLoading();
            this.showMainContent();
            this.showSection('stats');
            
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
            this.showError(`Не удалось загрузить данные: ${error.message}. Пожалуйста, откройте веб-панель через бота командой /web`);
        }
    }

    decompressData(compressedStr) {
        try {
            console.log("🔧 Декомпрессия данных...");
            
            // Декодируем base64
            const binaryString = atob(compressedStr);
            console.log("📐 Двоичная строка:", binaryString.length, "символов");
            
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Декомпрессия с использованием pako
            console.log("🎯 Начинаем распаковку...");
            const decompressed = pako.inflate(bytes, { to: 'string' });
            console.log("📄 Распакованные данные:", decompressed.length, "символов");
            
            const result = JSON.parse(decompressed);
            console.log("✅ JSON успешно распарсен");
            return result;
            
        } catch (error) {
            console.error('❌ Ошибка декомпрессии:', error);
            
            // Попробуем альтернативный метод - возможно данные не сжаты
            try {
                console.log("🔄 Пробуем прямой JSON parse...");
                return JSON.parse(compressedStr);
            } catch (e) {
                console.error('❌ И прямой JSON тоже не сработал:', e);
                throw new Error(`Декомпрессия не удалась: ${error.message}`);
            }
        }
    }

    hideLoading() {
        document.getElementById('loadingSection').style.display = 'none';
        console.log("👋 Загрузка скрыта");
    }

    showMainContent() {
        document.getElementById('mainContent').style.display = 'block';
        console.log("📱 Основной контент показан");
        
        // Обновляем время последнего обновления
        if (this.data.timestamp) {
            const date = new Date(this.data.timestamp);
            document.getElementById('lastUpdate').textContent = 
                `Последнее обновление: ${date.toLocaleString('ru-RU')}`;
        }
    }

    showError(message) {
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('errorSection').style.display = 'block';
        document.getElementById('errorMessage').textContent = message;
        console.error("🚨 Ошибка:", message);
    }

    // ... остальные функции остаются без изменений ...
    showSection(sectionName) {
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });
        
        document.getElementById(sectionName + 'Section').style.display = 'block';
        
        document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        event.target.classList.add('active');
        
        if (sectionName === 'stats' && this.data) {
            this.displayStats();
        } else if (sectionName === 'messages' && this.data) {
            this.displayMessages();
        } else if (sectionName === 'media' && this.data) {
            this.displayMediaStats();
        }
    }

    displayStats() {
        if (!this.data) return;
        this.displayStatsCards();
        this.displayCharts();
    }

    displayStatsCards() {
        const data = this.data;
        const statsCards = document.getElementById('statsCards');
        
        statsCards.innerHTML = `
            <div class="col-md-3 mb-4">
                <div class="card stat-card bg-primary text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h3>${data.total_messages}</h3>
                                <p>Всего сообщений</p>
                            </div>
                            <div class="icon">
                                <i class="fas fa-comments fa-2x"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-3 mb-4">
                <div class="card stat-card bg-success text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h3>${data.text_messages}</h3>
                                <p>Текстовых</p>
                            </div>
                            <div class="icon">
                                <i class="fas fa-file-text fa-2x"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-3 mb-4">
                <div class="card stat-card bg-warning text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h3>${data.media_messages}</h3>
                                <p>Медиафайлов</p>
                            </div>
                            <div class="icon">
                                <i class="fas fa-photo-video fa-2x"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-3 mb-4">
                <div class="card stat-card bg-info text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h3>${data.unique_senders}</h3>
                                <p>Уникальных отправителей</p>
                            </div>
                            <div class="icon">
                                <i class="fas fa-users fa-2x"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    displayCharts() {
        this.displayActivityChart();
        this.displayMediaChart();
    }

    displayActivityChart() {
        const dailyStats = this.data.daily_stats;
        const ctx = document.getElementById('activityChart').getContext('2d');
        
        if (window.activityChart) {
            window.activityChart.destroy();
        }

        window.activityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dailyStats.map(day => {
                    const date = new Date(day.date);
                    return date.toLocaleDateString('ru-RU');
                }),
                datasets: [{
                    label: 'Сообщений в день',
                    data: dailyStats.map(day => day.count),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    }

    displayMediaChart() {
        const mediaStats = this.data.media_stats;
        const ctx = document.getElementById('mediaChart').getContext('2d');
        
        if (window.mediaChart) {
            window.mediaChart.destroy();
        }

        const mediaTypes = {
            'Фото': mediaStats.photo || 0,
            'Видео': mediaStats.video || 0,
            'Аудио': mediaStats.audio || 0,
            'Стикеры': mediaStats.sticker || 0,
            'Документы': mediaStats.document || 0
        };

        window.mediaChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(mediaTypes),
                datasets: [{
                    data: Object.values(mediaTypes),
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                    }
                }
            }
        });
    }

    displayMessages() {
        const messages = this.data.recent_messages;
        const table = document.getElementById('messagesTable');
        
        if (!messages || messages.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4">
                        <i class="fas fa-inbox fa-2x text-muted mb-3"></i>
                        <p>Нет сообщений</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        table.innerHTML = messages.map(msg => `
            <tr>
                <td>
                    ${msg.is_media ? 
                        '<span class="badge bg-success">Медиа</span>' : 
                        '<span class="badge bg-primary">Текст</span>'
                    }
                </td>
                <td>@${msg.user_login || 'Неизвестно'}</td>
                <td>
                    ${msg.is_media ? 
                        `<i class="fas fa-file"></i> ${msg.path || 'Файл'}` : 
                        (msg.text || 'Сообщение')
                    }
                </td>
                <td>${new Date(msg.date).toLocaleString('ru-RU')}</td>
            </tr>
        `).join('');
    }

    displayMediaStats() {
        const mediaStats = this.data.media_stats;
        const container = document.getElementById('mediaStatsCards');
        
        const stats = {
            'Фото': mediaStats.photo || 0,
            'Видео': mediaStats.video || 0,
            'Аудио': mediaStats.audio || 0,
            'Стикеры': mediaStats.sticker || 0,
            'Документы': mediaStats.document || 0
        };

        container.innerHTML = Object.entries(stats).map(([type, count]) => `
            <div class="col-md-4 mb-3">
                <div class="card">
                    <div class="card-body text-center">
                        <div class="media-icon mb-2">
                            ${this.getMediaIcon(type)}
                        </div>
                        <h4>${count}</h4>
                        <p class="text-muted">${type}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getMediaIcon(type) {
        const icons = {
            'Фото': 'fas fa-image text-primary',
            'Видео': 'fas fa-video text-danger',
            'Аудио': 'fas fa-music text-success',
            'Стикеры': 'fas fa-sticky-note text-warning',
            'Документы': 'fas fa-file text-secondary'
        };
        return `<i class="${icons[type] || 'fas fa-file'} fa-2x"></i>`;
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 DOM загружен, инициализируем AvacoreDashboard...");
    window.avacoreDashboard = new AvacoreDashboard();
});

function showSection(sectionName) {
    if (window.avacoreDashboard) {
        window.avacoreDashboard.showSection(sectionName);
    }
}
