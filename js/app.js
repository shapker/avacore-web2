// js/app.js - обновленная версия для компактного формата данных

// Глобальные переменные
let activityChart = null;
let mediaChart = null;

// Функция для декодирования данных из URL
function decodeDataFromURL() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedData = urlParams.get('data');
        
        if (!encodedData) {
            throw new Error('Нет данных в URL');
        }

        // Пытаемся сначала декодировать как сжатые данные
        try {
            // Декодируем из base64
            const compressedData = Uint8Array.from(atob(encodedData), c => c.charCodeAt(0));
            
            // Декомпрессия с помощью pako (zlib)
            const jsonStr = pako.inflate(compressedData, { to: 'string' });
            const userData = JSON.parse(jsonStr);
            
            console.log('📊 Данные пользователя загружены (сжатый формат):', userData);
            return userData;
        } catch (compressionError) {
            console.log('⚠️ Не удалось декомпрессировать, пробуем простой base64...');
            
            // Резервный вариант - простой base64
            const jsonStr = atob(encodedData);
            const userData = JSON.parse(jsonStr);
            
            console.log('📊 Данные пользователя загружены (простой формат):', userData);
            return userData;
        }
    } catch (error) {
        console.error('❌ Ошибка декодирования данных:', error);
        throw error;
    }
}

// Функция для отображения секции
function showSection(sectionName) {
    // Скрываем все секции
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Деактивируем все ссылки навигации
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Показываем выбранную секцию и активируем ссылку
    document.getElementById(sectionName + 'Section').style.display = 'block';
    event.target.classList.add('active');
    
    // Загружаем данные для секции
    if (sectionName === 'stats') {
        loadStatsSection();
    } else if (sectionName === 'messages') {
        loadMessagesSection();
    } else if (sectionName === 'media') {
        loadMediaSection();
    }
}

// Загрузка секции статистики
function loadStatsSection() {
    const userData = window.userData;
    
    // Обновляем время последнего обновления
    const updateTime = userData.ts ? new Date(userData.ts).toLocaleString() : new Date().toLocaleString();
    document.getElementById('lastUpdate').textContent = `Последнее обновление: ${updateTime}`;
    
    // Загружаем карточки статистики
    const statsCards = document.getElementById('statsCards');
    statsCards.innerHTML = `
        <div class="col-md-3 col-6 mb-4">
            <div class="card stats-card h-100">
                <div class="card-body text-center">
                    <i class="fas fa-comments fa-2x text-primary mb-2"></i>
                    <h3>${userData.total || 0}</h3>
                    <p class="text-muted mb-0">Всего сообщений</p>
                </div>
            </div>
        </div>
        <div class="col-md-3 col-6 mb-4">
            <div class="card stats-card h-100">
                <div class="card-body text-center">
                    <i class="fas fa-font fa-2x text-success mb-2"></i>
                    <h3>${userData.text || 0}</h3>
                    <p class="text-muted mb-0">Текстовых</p>
                </div>
            </div>
        </div>
        <div class="col-md-3 col-6 mb-4">
            <div class="card stats-card h-100">
                <div class="card-body text-center">
                    <i class="fas fa-photo-video fa-2x text-warning mb-2"></i>
                    <h3>${userData.media || 0}</h3>
                    <p class="text-muted mb-0">Медиафайлов</p>
                </div>
            </div>
        </div>
        <div class="col-md-3 col-6 mb-4">
            <div class="card stats-card h-100">
                <div class="card-body text-center">
                    <i class="fas fa-users fa-2x text-info mb-2"></i>
                    <h3>${userData.senders || 0}</h3>
                    <p class="text-muted mb-0">Отправителей</p>
                </div>
            </div>
        </div>
    `;
    
    // Создаем графики
    createCharts(userData);
}

// Создание графиков
function createCharts(userData) {
    const mStats = userData.m_stats || {};
    
    // График активности (упрощенный)
    const activityCtx = document.getElementById('activityChart').getContext('2d');
    if (activityChart) {
        activityChart.destroy();
    }
    
    activityChart = new Chart(activityCtx, {
        type: 'line',
        data: {
            labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
            datasets: [{
                label: 'Сообщений в день',
                data: [12, 19, 8, 15, 12, 16, 11],
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    // Круговая диаграмма медиа
    const mediaCtx = document.getElementById('mediaChart').getContext('2d');
    if (mediaChart) {
        mediaChart.destroy();
    }
    
    mediaChart = new Chart(mediaCtx, {
        type: 'doughnut',
        data: {
            labels: ['Фото', 'Видео', 'Голосовые', 'Аудио', 'Стикеры', 'Документы'],
            datasets: [{
                data: [
                    mStats.p || 0,  // photo
                    mStats.v || 0,  // video
                    mStats.vo || 0, // voice
                    mStats.a || 0,  // audio
                    mStats.s || 0,  // sticker
                    mStats.d || 0   // document
                ],
                backgroundColor: [
                    '#ff6b6b', '#4834d4', '#00d2d3', '#00b894', '#fdcb6e', '#a29bfe'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Загрузка секции сообщений
function loadMessagesSection() {
    const userData = window.userData;
    const messagesTable = document.getElementById('messagesTable');
    
    const messages = userData.messages || [];
    
    if (messages.length === 0) {
        messagesTable.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-3x mb-3"></i>
                    <p>Нет сообщений</p>
                </td>
            </tr>
        `;
        return;
    }
    
    messagesTable.innerHTML = messages.map(message => {
        const icon = message.m ? 
            getMediaIcon(message.ty) : 
            '<i class="fas fa-text-width text-primary"></i>';
        
        const content = message.m ? 
            `<span class="badge bg-secondary">${getMediaTypeText(message.ty)}</span>` :
            (message.t || '') + (message.t && message.t.length >= 50 ? '...' : '');
        
        return `
            <tr>
                <td>${icon}</td>
                <td>${message.u || 'Неизвестно'}</td>
                <td>${content}</td>
                <td>${message.d || 'Неизвестно'}</td>
            </tr>
        `;
    }).join('');
}

// Загрузка секции медиа
function loadMediaSection() {
    const userData = window.userData;
    const mediaStatsCards = document.getElementById('mediaStatsCards');
    
    // Статистика по типам медиа
    const mStats = userData.m_stats || {};
    mediaStatsCards.innerHTML = `
        <div class="col-md-2 col-6 mb-3">
            <div class="card text-center stats-card">
                <div class="card-body">
                    <i class="fas fa-image fa-2x text-primary"></i>
                    <h5 class="mt-2">${mStats.p || 0}</h5>
                    <p class="text-muted mb-0">Фото</p>
                </div>
            </div>
        </div>
        <div class="col-md-2 col-6 mb-3">
            <div class="card text-center stats-card">
                <div class="card-body">
                    <i class="fas fa-video fa-2x text-success"></i>
                    <h5 class="mt-2">${mStats.v || 0}</h5>
                    <p class="text-muted mb-0">Видео</p>
                </div>
            </div>
        </div>
        <div class="col-md-2 col-6 mb-3">
            <div class="card text-center stats-card">
                <div class="card-body">
                    <i class="fas fa-microphone fa-2x text-info"></i>
                    <h5 class="mt-2">${mStats.vo || 0}</h5>
                    <p class="text-muted mb-0">Голосовые</p>
                </div>
            </div>
        </div>
        <div class="col-md-2 col-6 mb-3">
            <div class="card text-center stats-card">
                <div class="card-body">
                    <i class="fas fa-music fa-2x text-warning"></i>
                    <h5 class="mt-2">${mStats.a || 0}</h5>
                    <p class="text-muted mb-0">Аудио</p>
                </div>
            </div>
        </div>
        <div class="col-md-2 col-6 mb-3">
            <div class="card text-center stats-card">
                <div class="card-body">
                    <i class="fas fa-sticky-note fa-2x text-danger"></i>
                    <h5 class="mt-2">${mStats.s || 0}</h5>
                    <p class="text-muted mb-0">Стикеры</p>
                </div>
            </div>
        </div>
        <div class="col-md-2 col-6 mb-3">
            <div class="card text-center stats-card">
                <div class="card-body">
                    <i class="fas fa-file fa-2x text-secondary"></i>
                    <h5 class="mt-2">${mStats.d || 0}</h5>
                    <p class="text-muted mb-0">Документы</p>
                </div>
            </div>
        </div>
    `;
    
    // Создаем галерею медиафайлов
    createMediaGallery(userData.files || []);
}

// Создание галереи медиафайлов
function createMediaGallery(mediaFiles) {
    const mediaContainer = document.querySelector('#mediaSection .card-body .row');
    
    // Удаляем старую галерею если есть
    const oldGallery = document.getElementById('mediaGallery');
    if (oldGallery) {
        oldGallery.remove();
    }
    
    // Создаем контейнер для галереи
    const galleryRow = document.createElement('div');
    galleryRow.className = 'row mt-4';
    galleryRow.id = 'mediaGallery';
    
    if (mediaFiles.length === 0) {
        galleryRow.innerHTML = `
            <div class="col-12">
                <div class="text-center text-muted py-5">
                    <i class="fas fa-photo-video fa-3x mb-3"></i>
                    <p>Нет медиафайлов</p>
                </div>
            </div>
        `;
    } else {
        galleryRow.innerHTML = `
            <div class="col-12">
                <h5><i class="fas fa-images"></i> Галерея медиафайлов</h5>
                <p class="text-muted">Нажмите на файл для просмотра</p>
                <div class="media-grid" id="mediaGrid"></div>
            </div>
        `;
        
        const mediaGrid = document.getElementById('mediaGrid');
        mediaGrid.innerHTML = mediaFiles.map(media => {
            // Восстанавливаем полный путь к файлу
            const fullPath = `media/user_${window.userData.uid}/${media.p}`;
            
            return `
                <div class="media-item" onclick="openMediaModal('${fullPath}', '${media.t}')">
                    <div class="media-preview media-${media.t}">
                        ${getMediaPreviewIcon(media.t)}
                    </div>
                    <div class="media-info">
                        <div class="media-type">${getMediaTypeText(media.t)}</div>
                        <div class="media-date">${media.d}</div>
                        <small class="text-muted">${media.u}</small>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    mediaContainer.appendChild(galleryRow);
}

// Функция для открытия модального окна с медиа
function openMediaModal(filePath, mediaType) {
    // Создаем модальное окно если его нет
    let modal = document.getElementById('mediaModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal fade media-modal';
        modal.id = 'mediaModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Просмотр медиа</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div id="mediaContent"></div>
                        <p class="mt-3 text-muted">${filePath}</p>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Загружаем контент в зависимости от типа медиа
    const mediaContent = document.getElementById('mediaContent');
    let contentHtml = '';
    
    switch (mediaType) {
        case 'photo':
            contentHtml = `<img src="${filePath}" class="media-content" alt="Фото" onerror="this.style.display='none'; document.getElementById('fallbackContent').style.display='block';">`;
            break;
        case 'video':
            contentHtml = `<video controls class="media-content">
                <source src="${filePath}" type="video/mp4">
                Ваш браузер не поддерживает видео.
            </video>`;
            break;
        case 'voice':
        case 'audio':
            contentHtml = `<audio controls class="audio-player">
                <source src="${filePath}" type="audio/ogg">
                Ваш браузер не поддерживает аудио.
            </audio>`;
            break;
        default:
            contentHtml = `
                <div class="text-center py-4">
                    <i class="fas fa-file-download fa-3x text-primary mb-3"></i>
                    <p>Файл: ${filePath.split('/').pop()}</p>
                    <a href="${filePath}" class="btn btn-primary" download>
                        <i class="fas fa-download"></i> Скачать файл
                    </a>
                </div>
            `;
    }
    
    // Добавляем fallback контент
    contentHtml += `
        <div id="fallbackContent" style="display: none;" class="text-center py-4">
            <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
            <p>Не удалось загрузить медиафайл</p>
            <a href="${filePath}" class="btn btn-outline-primary" download>
                <i class="fas fa-download"></i> Скачать файл
            </a>
        </div>
    `;
    
    mediaContent.innerHTML = contentHtml;
    
    // Показываем модальное окно
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
}

// Вспомогательные функции для работы с медиа
function getMediaIcon(mediaType) {
    const icons = {
        'photo': 'fas fa-image text-success',
        'video': 'fas fa-video text-danger', 
        'voice': 'fas fa-microphone text-primary',
        'audio': 'fas fa-music text-warning',
        'sticker': 'fas fa-sticky-note text-info',
        'document': 'fas fa-file text-secondary',
        'text': 'fas fa-text-width text-primary'
    };
    return `<i class="${icons[mediaType] || 'fas fa-file'}"></i>`;
}

function getMediaPreviewIcon(mediaType) {
    const icons = {
        'photo': '<i class="fas fa-camera"></i>',
        'video': '<i class="fas fa-film"></i>',
        'voice': '<i class="fas fa-microphone"></i>',
        'audio': '<i class="fas fa-music"></i>',
        'sticker': '<i class="fas fa-sticky-note"></i>',
        'document': '<i class="fas fa-file"></i>'
    };
    return icons[mediaType] || '<i class="fas fa-file"></i>';
}

function getMediaTypeText(mediaType) {
    const types = {
        'photo': 'Фото',
        'video': 'Видео',
        'voice': 'Голосовое',
        'audio': 'Аудио',
        'sticker': 'Стикер',
        'document': 'Документ',
        'text': 'Текст'
    };
    return types[mediaType] || 'Файл';
}

// Функция для обработки ошибок загрузки медиа
function handleMediaError(element) {
    element.style.display = 'none';
    const fallback = document.getElementById('fallbackContent');
    if (fallback) {
        fallback.style.display = 'block';
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Декодируем данные из URL
        window.userData = decodeDataFromURL();
        
        // Скрываем загрузку и показываем основной контент
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        
        // Загружаем начальную секцию
        showSection('stats');
        
        console.log('✅ Веб-приложение успешно загружено');
        
    } catch (error) {
        // Показываем ошибку
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('errorSection').style.display = 'block';
        document.getElementById('errorMessage').textContent = error.message;
        
        console.error('❌ Ошибка инициализации:', error);
    }
});

// Функция для обновления данных
function refreshData() {
    location.reload();
}

// Обработчик для навигации (исправляем ошибку event)
document.addEventListener('DOMContentLoaded', function() {
    // Вешаем обработчики на навигационные ссылки
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionName = this.getAttribute('onclick').match(/showSection\('([^']+)'\)/)[1];
            
            // Скрываем все секции
            document.querySelectorAll('.content-section').forEach(section => {
                section.style.display = 'none';
            });
            
            // Деактивируем все ссылки навигации
            document.querySelectorAll('.nav-link').forEach(navLink => {
                navLink.classList.remove('active');
            });
            
            // Показываем выбранную секцию и активируем ссылку
            document.getElementById(sectionName + 'Section').style.display = 'block';
            this.classList.add('active');
            
            // Загружаем данные для секции
            if (sectionName === 'stats') {
                loadStatsSection();
            } else if (sectionName === 'messages') {
                loadMessagesSection();
            } else if (sectionName === 'media') {
                loadMediaSection();
            }
        });
    });
});
