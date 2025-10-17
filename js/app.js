// Основные переменные
let currentData = null;
let activityChart = null;
let mediaChart = null;

// Функции навигации
function showSection(sectionName) {
    // Скрываем все разделы
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Показываем выбранный раздел
    document.getElementById(sectionName + 'Section').style.display = 'block';
    
    // Обновляем активное состояние в навигации
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Если переходим в статистику, обновляем графики
    if (sectionName === 'stats' && currentData) {
        setTimeout(() => {
            updateCharts();
        }, 100);
    }
}

// Функция декомпрессии данных из URL
function decompressData() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const compressedData = urlParams.get('data');
        
        if (!compressedData) {
            throw new Error('Данные не найдены в URL');
        }
        
        console.log('🔗 Получены данные из URL:', compressedData.length, 'символов');
        
        // Декодируем base64
        const binaryString = atob(compressedData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Декомпрессия с помощью pako
        const decompressed = pako.inflate(bytes, { to: 'string' });
        const data = JSON.parse(decompressed);
        
        console.log('📊 Данные успешно декомпрессированы:', data);
        return data;
        
    } catch (error) {
        console.error('❌ Ошибка декомпрессии:', error);
        throw error;
    }
}

// Функция отображения статистики
function displayStats(data) {
    // Обновляем время последнего обновления
    document.getElementById('lastUpdate').textContent = 
        `Последнее обновление: ${new Date().toLocaleString('ru-RU')}`;
    
    // Заполняем карточки статистики
    const statsCards = document.getElementById('statsCards');
    statsCards.innerHTML = `
        <div class="col-md-3 mb-4">
            <div class="card stats-card bg-primary text-white">
                <div class="card-body text-center">
                    <i class="fas fa-comments fa-2x mb-3"></i>
                    <h3 class="card-title">${data.total_messages}</h3>
                    <p class="card-text">Всего сообщений</p>
                </div>
            </div>
        </div>
        <div class="col-md-3 mb-4">
            <div class="card stats-card bg-success text-white">
                <div class="card-body text-center">
                    <i class="fas fa-font fa-2x mb-3"></i>
                    <h3 class="card-title">${data.text_messages}</h3>
                    <p class="card-text">Текстовых</p>
                </div>
            </div>
        </div>
        <div class="col-md-3 mb-4">
            <div class="card stats-card bg-info text-white">
                <div class="card-body text-center">
                    <i class="fas fa-photo-video fa-2x mb-3"></i>
                    <h3 class="card-title">${data.media_messages}</h3>
                    <p class="card-text">Медиафайлов</p>
                </div>
            </div>
        </div>
        <div class="col-md-3 mb-4">
            <div class="card stats-card bg-warning text-white">
                <div class="card-body text-center">
                    <i class="fas fa-users fa-2x mb-3"></i>
                    <h3 class="card-title">${data.unique_senders}</h3>
                    <p class="card-text">Отправителей</p>
                </div>
            </div>
        </div>
    `;
}

// Функция отображения сообщений
function displayMessages(messages) {
    const messagesTable = document.getElementById('messagesTable');
    
    if (!messages || messages.length === 0) {
        messagesTable.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4">
                    <i class="fas fa-inbox fa-2x text-muted mb-2"></i>
                    <p class="text-muted">Нет сообщений</p>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    messages.forEach((msg, index) => {
        const messageType = msg.is_media ? 'Медиа' : 'Текст';
        const typeBadge = msg.is_media ? 
            '<span class="badge bg-info"><i class="fas fa-file"></i> Медиа</span>' : 
            '<span class="badge bg-primary"><i class="fas fa-text"></i> Текст</span>';
        
        const content = msg.is_media ? 
            `<i class="fas fa-file"></i> ${msg.path ? msg.path.split('/').pop() : 'Файл'}` : 
            (msg.text ? msg.text.substring(0, 100) + (msg.text.length > 100 ? '...' : '') : 'Пустое сообщение');
        
        const date = msg.date ? new Date(msg.date).toLocaleString('ru-RU') : 'Неизвестно';
        
        html += `
            <tr>
                <td>${typeBadge}</td>
                <td>${msg.user_login || 'Неизвестно'}</td>
                <td>${content}</td>
                <td><small class="text-muted">${date}</small></td>
            </tr>
        `;
    });
    
    messagesTable.innerHTML = html;
}

// Функция отображения статистики медиа
function displayMediaStats(mediaStats) {
    const mediaStatsCards = document.getElementById('mediaStatsCards');
    
    const mediaTypes = [
        { type: 'photo', name: 'Фото', icon: 'fa-camera', color: 'primary' },
        { type: 'video', name: 'Видео', icon: 'fa-video', color: 'success' },
        { type: 'audio', name: 'Аудио', icon: 'fa-microphone', color: 'info' },
        { type: 'sticker', name: 'Стикеры', icon: 'fa-smile', color: 'warning' },
        { type: 'document', name: 'Документы', icon: 'fa-file', color: 'secondary' }
    ];
    
    let html = '';
    mediaTypes.forEach(mediaType => {
        const count = mediaStats[mediaType.type] || 0;
        html += `
            <div class="col-md-4 mb-4">
                <div class="card stats-card bg-${mediaType.color} text-white">
                    <div class="card-body text-center">
                        <i class="fas ${mediaType.icon} fa-2x mb-3"></i>
                        <h3 class="card-title">${count}</h3>
                        <p class="card-text">${mediaType.name}</p>
                    </div>
                </div>
            </div>
        `;
    });
    
    mediaStatsCards.innerHTML = html;
}

// Функция создания графиков
function createCharts(data) {
    createActivityChart(data.daily_stats);
    createMediaDistributionChart(data.media_stats);
}

function createActivityChart(dailyStats) {
    const ctx = document.getElementById('activityChart').getContext('2d');
    
    // Уничтожаем предыдущий график если существует
    if (activityChart) {
        activityChart.destroy();
    }
    
    const labels = dailyStats.map(day => {
        const date = new Date(day.date);
        return date.toLocaleDateString('ru-RU', { weekday: 'short', month: 'short', day: 'numeric' });
    });
    
    const counts = dailyStats.map(day => day.count);
    
    activityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Сообщений в день',
                data: counts,
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Активность за 7 дней'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function createMediaDistributionChart(mediaStats) {
    const ctx = document.getElementById('mediaChart').getContext('2d');
    
    // Уничтожаем предыдущий график если существует
    if (mediaChart) {
        mediaChart.destroy();
    }
    
    const mediaTypes = ['photo', 'video', 'audio', 'sticker', 'document'];
    const labels = ['Фото', 'Видео', 'Аудио', 'Стикеры', 'Документы'];
    const data = mediaTypes.map(type => mediaStats[type] || 0);
    const backgroundColors = [
        'rgba(54, 162, 235, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 205, 86, 0.8)',
        'rgba(201, 203, 207, 0.8)'
    ];
    
    mediaChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            cutout: '60%'
        }
    });
}

// Функция обновления графиков
function updateCharts() {
    if (currentData) {
        createCharts(currentData);
    }
}

// Функция показа ошибки
function showError(message) {
    document.getElementById('loadingSection').style.display = 'none';
    document.getElementById('errorSection').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
    console.error('❌ Ошибка:', message);
}

// Основная функция инициализации
function initApp() {
    console.log('🚀 Инициализация Avacore Web...');
    
    try {
        // Пытаемся получить данные из URL
        const data = decompressData();
        currentData = data;
        
        // Скрываем загрузку и показываем основной контент
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        
        // Отображаем данные
        displayStats(data);
        displayMessages(data.recent_messages);
        displayMediaStats(data.media_stats);
        createCharts(data);
        
        console.log('✅ Приложение успешно инициализировано');
        
    } catch (error) {
        showError(error.message);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Запускаем приложение с небольшой задержкой для демонстрации загрузки
    setTimeout(initApp, 1000);
    
    // Обработчик для кнопки обновления в футере
    document.querySelector('footer a').addEventListener('click', function(e) {
        e.preventDefault();
        location.reload();
    });
});
