// Основная логика игры

class Game {
    constructor() {
        this.currentStage = 0;
        this.totalStages = GAME_CONFIG.totalStages;
        this.isMusicPlaying = false;
        this.isMusicEnabled = true; // Музыка включена по умолчанию
        this.progressKey = 'footballQuest30_progress';
        
        // Список музыкальных треков для проигрывания по очереди
        this.musicTracks = [
            './assets/audio/holigan.mp3',
            './assets/audio/medlyak.mp3'
        ];
        this.currentTrackIndex = 0;
        
        // Флаг для предотвращения множественных обновлений карты
        this.isUpdatingMap = false;
        
        // Инициализация флагов
        this.splashScreenShown = false;
        
        // Проверка ориентации экрана (вызываем методы напрямую, без this)
        this.isMobile = this.checkIfMobile();
        this.isPortraitOrientation = this.checkOrientation();
        
        this.init();
    }
    
    // Проверка, является ли устройство мобильным
    checkIfMobile() {
        return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    // Проверка ориентации экрана
    checkOrientation() {
        const isMobile = this.checkIfMobile();
        if (!isMobile) return false;
        return window.innerHeight > window.innerWidth;
    }
    
    init() {
        this.setupElements();
        this.setupEventListeners();
        this.loadProgress();
        this.setupAudio();
        this.initMap();
        
        // Обработчик изменения размера окна
        this.setupResizeHandler();
        
        // Обработчик изменения ориентации
        this.setupOrientationHandler();
        
        // Таймер для подсказок
        this.hintTimer = null;
        
        // Проверяем ориентацию и показываем соответствующий экран
        // Используем небольшую задержку для гарантии, что все элементы загружены
        setTimeout(() => {
            if (!this.checkAndShowOrientationScreen()) {
                // Если не портретная ориентация - показываем splash screen
                if (!this.splashScreenShown) {
                    this.showSplashScreen();
                    this.splashScreenShown = true;
                }
            }
        }, 100);
    }
    
    setupOrientationHandler() {
        // Проверяем ориентацию при изменении размера окна
        window.addEventListener('resize', () => {
            this.isPortraitOrientation = this.checkOrientation();
            this.isMobile = this.checkIfMobile();
            this.checkAndShowOrientationScreen();
        });
        
        // Также проверяем при изменении ориентации (для мобильных устройств)
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.isPortraitOrientation = this.checkOrientation();
                this.isMobile = this.checkIfMobile();
                this.checkAndShowOrientationScreen();
            }, 100);
        });
    }
    
    checkAndShowOrientationScreen() {
        // Обновляем проверку ориентации
        this.isMobile = this.checkIfMobile();
        this.isPortraitOrientation = this.checkOrientation();
        
        // Если мобильное устройство и портретная ориентация - показываем заглушку
        if (this.isMobile && this.isPortraitOrientation) {
            if (this.orientationScreen) {
                this.orientationScreen.classList.remove('hidden');
                // Скрываем все остальные экраны
                document.querySelectorAll('.screen, .splash-screen').forEach(screen => {
                    screen.classList.remove('active');
                });
            }
            return true; // Блокируем дальнейшую загрузку
        } else {
            // Альбомная ориентация или не мобильное устройство
            if (this.orientationScreen) {
                this.orientationScreen.classList.add('hidden');
            }
            return false;
        }
    }
    
    showSplashScreen() {
        // Если портретная ориентация - не показываем splash
        if (this.checkAndShowOrientationScreen()) {
            return;
        }
        
        if (this.splashScreen) {
            this.splashScreen.classList.add('active');
            // Показываем splash screen 2 секунды, затем переключаемся
            setTimeout(() => {
                // Еще раз проверяем ориентацию перед переходом
                if (this.checkAndShowOrientationScreen()) {
                    if (this.splashScreen) {
                        this.splashScreen.classList.remove('active');
                    }
                    return;
                }
                
                if (this.splashScreen) {
                    this.splashScreen.classList.remove('active');
                }
                // Показать стартовый экран или экран восстановления
                // Небольшая задержка для плавного перехода
                setTimeout(() => {
                    if (this.currentStage > 0 && this.currentStage < this.totalStages) {
                        this.showRestoreScreen();
                    } else {
                        this.showScreen('startScreen');
                    }
                }, 300);
            }, 2000);
        } else {
            // Если splash screen нет, сразу показываем основной экран
            if (!this.checkAndShowOrientationScreen()) {
                if (this.currentStage > 0 && this.currentStage < this.totalStages) {
                    this.showRestoreScreen();
                } else {
                    this.showScreen('startScreen');
                }
            }
        }
    }
    
    showHowToPlay() {
        if (this.howToPlayModal) {
            this.howToPlayModal.classList.remove('hidden');
        }
    }
    
    hideHowToPlay() {
        if (this.howToPlayModal) {
            this.howToPlayModal.classList.add('hidden');
        }
    }
    
    setupResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            // Дебаунс для избежания частых пересчётов
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // Пересчитываем карту только если она активна
                if (this.mapScreen && this.mapScreen.classList.contains('active')) {
                    // Сбрасываем трансформацию камеры перед обновлением
                    const mapContainer = document.querySelector('.map-container');
                    if (mapContainer) {
                        mapContainer.style.transform = 'translate(0, 0)';
                        mapContainer.style.webkitTransform = 'translate(0, 0)';
                    }
                    this.updateMap();
                }
            }, 300);
        });
    }
    
    setupElements() {
        // Экраны
        this.orientationScreen = document.getElementById('orientationScreen');
        this.splashScreen = document.getElementById('splashScreen');
        this.startScreen = document.getElementById('startScreen');
        this.mapScreen = document.getElementById('mapScreen');
        this.taskScreen = document.getElementById('taskScreen');
        this.restoreScreen = document.getElementById('restoreScreen');
        this.finalScreen = document.getElementById('finalScreen');
        
        // Кнопки
        this.startBtn = document.getElementById('startBtn');
        this.howToPlayBtn = document.getElementById('howToPlayBtn');
        this.howToPlayClose = document.getElementById('howToPlayClose');
        this.howToPlayStartBtn = document.getElementById('howToPlayStartBtn');
        this.howToPlayModal = document.getElementById('howToPlayModal');
        this.musicToggleBtn = document.getElementById('musicToggleBtn');
        this.musicToggleBtnMap = document.getElementById('musicToggleBtnMap');
        this.startBallBtn = document.getElementById('startBallBtn');
        this.continueBtn = document.getElementById('continueBtn');
        this.restoreYesBtn = document.getElementById('restoreYesBtn');
        this.restoreNoBtn = document.getElementById('restoreNoBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.modalNextBtn = document.getElementById('modalNextBtn');
        this.modalClose = document.getElementById('modalClose');
        
        // Элементы карты
        this.map = document.getElementById('map');
        this.character = document.getElementById('character');
        
        // Элементы задания
        this.taskTitle = document.getElementById('taskTitle');
        this.taskBody = document.getElementById('taskBody');
        this.taskFeedback = document.getElementById('taskFeedback');
        
        // Модальное окно
        this.contentModal = document.getElementById('contentModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalBody = document.getElementById('modalBody');
        this.modalDescription = document.getElementById('modalDescription');
        
        // Прогресс
        this.progressText = document.getElementById('progressText');
        this.restoreStageNumber = document.getElementById('restoreStageNumber');
        
        // Финальный экран
        this.finalContent = document.getElementById('finalContent');
        this.confettiContainer = document.getElementById('confettiContainer');
        
        // Подсказка при старте
        this.startHint = document.getElementById('startHint');
        
        // Аудио
        this.backgroundMusic = document.getElementById('backgroundMusic');
        this.goalSound = document.getElementById('goalSound');
        this.applauseSound = document.getElementById('applauseSound');
        
        // Загрузчик
        this.loader = document.getElementById('loader');
    }
    
    setupEventListeners() {
        // Добавляем обработчики только если элементы существуют
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.startGame());
        }
        if (this.howToPlayBtn) {
            this.howToPlayBtn.addEventListener('click', () => this.showHowToPlay());
        }
        if (this.howToPlayClose) {
            this.howToPlayClose.addEventListener('click', () => this.hideHowToPlay());
        }
        if (this.howToPlayStartBtn) {
            this.howToPlayStartBtn.addEventListener('click', () => {
                this.hideHowToPlay();
                this.startGame();
            });
        }
        if (this.howToPlayModal) {
            this.howToPlayModal.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay')) {
                    this.hideHowToPlay();
                }
            });
        }
        if (this.musicToggleBtn) {
            this.musicToggleBtn.addEventListener('click', () => this.toggleMusic());
        }
        if (this.musicToggleBtnMap) {
            this.musicToggleBtnMap.addEventListener('click', () => this.toggleMusic());
        }
        if (this.startBallBtn) {
            this.startBallBtn.addEventListener('click', () => this.startBallAnimation());
        }
        if (this.startHint) {
            // Закрываем подсказку по клику
            this.startHint.addEventListener('click', () => {
                if (this.startHint) {
                    this.startHint.style.display = 'none';
                }
            });
        }
        if (this.continueBtn) {
            this.continueBtn.addEventListener('click', () => this.showContentModal());
        }
        if (this.restoreYesBtn) {
            this.restoreYesBtn.addEventListener('click', () => this.restoreGame());
        }
        if (this.restoreNoBtn) {
            this.restoreNoBtn.addEventListener('click', () => this.resetProgress());
        }
        if (this.restartBtn) {
            this.restartBtn.addEventListener('click', () => this.resetProgress());
        }
        if (this.modalNextBtn) {
            this.modalNextBtn.addEventListener('click', () => this.showMapAfterContent());
        }
        if (this.modalClose) {
            this.modalClose.addEventListener('click', () => this.closeModal());
        }
        
        // Закрытие модального окна по клику вне его
        if (this.contentModal) {
            this.contentModal.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay')) {
                    this.closeModal();
                }
            });
        }
        
        // Обработка ошибок загрузки медиа
        if (this.backgroundMusic) {
            this.backgroundMusic.addEventListener('error', () => this.handleMediaError('music'));
        }
        if (this.goalSound) {
            this.goalSound.addEventListener('error', () => this.handleMediaError('sound'));
        }
        if (this.applauseSound) {
            this.applauseSound.addEventListener('error', () => this.handleMediaError('sound'));
        }
    }
    
    setupAudio() {
        // Устанавливаем громкость
        this.backgroundMusic.volume = GAME_SETTINGS.musicVolume;
        this.goalSound.volume = GAME_SETTINGS.soundEffectsVolume;
        this.applauseSound.volume = GAME_SETTINGS.soundEffectsVolume;
        
        // Настройка автоматического переключения треков
        if (this.backgroundMusic) {
            // Когда трек заканчивается, переключаемся на следующий
            this.backgroundMusic.addEventListener('ended', () => {
                this.playNextTrack();
            });
            
            // Загружаем первый трек
            this.loadTrack(this.currentTrackIndex);
            
            // Если музыка включена по умолчанию, запускаем её после загрузки
            if (this.isMusicEnabled) {
                this.backgroundMusic.addEventListener('loadeddata', () => {
                    this.isMusicPlaying = true;
                    this.backgroundMusic.play().catch(error => {
                        console.log('Автоплей заблокирован браузером, пользователь должен включить музыку вручную');
                        this.isMusicEnabled = false;
                        this.isMusicPlaying = false;
                    });
                }, { once: true });
            }
        }
    }
    
    // Загрузить трек по индексу
    loadTrack(index) {
        if (!this.musicTracks || this.musicTracks.length === 0) {
            console.warn('Нет музыкальных треков для проигрывания');
            return;
        }
        
        // Проверяем границы
        if (index < 0) index = this.musicTracks.length - 1;
        if (index >= this.musicTracks.length) index = 0;
        
        this.currentTrackIndex = index;
        const trackPath = this.musicTracks[this.currentTrackIndex];
        
        if (this.backgroundMusic) {
            this.backgroundMusic.src = trackPath;
            this.backgroundMusic.load(); // Перезагружаем аудио
            
            // Если музыка включена, запускаем автоматически
            if (this.isMusicEnabled && this.isMusicPlaying) {
                this.backgroundMusic.play().catch(error => {
                    console.error('Ошибка воспроизведения трека:', trackPath, error);
                    this.handleMediaError('music');
                });
            }
        }
    }
    
    // Воспроизвести следующий трек
    playNextTrack() {
        if (!this.musicTracks || this.musicTracks.length === 0) return;
        
        // Переходим к следующему треку (или к первому, если достигли конца)
        const nextIndex = (this.currentTrackIndex + 1) % this.musicTracks.length;
        this.loadTrack(nextIndex);
        
        // Если музыка включена, запускаем следующий трек
        if (this.isMusicEnabled && this.isMusicPlaying) {
            if (this.backgroundMusic) {
                this.backgroundMusic.play().catch(error => {
                    console.error('Ошибка воспроизведения следующего трека:', error);
                });
            }
        }
    }
    
    showScreen(screenId) {
        // Проверяем ориентацию перед показом любого экрана (только на мобильных)
        if (this.isMobile && this.checkAndShowOrientationScreen()) {
            return; // Блокируем показ экрана если портретная ориентация на мобильном
        }
        
        // Скрыть все экраны
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Показать нужный экран
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
        }
    }
    
    startGame() {
        this.currentStage = 0;
        this.showScreen('mapScreen');
        
        // Обновляем карту и ждём, пока она полностью загрузится
        this.updateMap();
        
        // Показываем подсказку и кнопку "разыграть мяч" после загрузки карты
        setTimeout(() => {
            // Показываем подсказку
            if (this.startHint) {
                this.startHint.style.display = 'block';
                // Скрываем подсказку через 5 секунд или при клике
                setTimeout(() => {
                    if (this.startHint) {
                        this.startHint.style.display = 'none';
                    }
                }, 5000);
            }
            
            // Показываем кнопку "разыграть мяч"
            if (this.startBallBtn) {
                this.startBallBtn.style.display = 'block';
            }
            
            // Камера остается статичной в центре поля (не двигаем её)
            // Начальная позиция камеры уже установлена в CSS (translate3d(0, 0, 0))
        }, 1000);
    }
    
    // Анимация подбрасывания мяча на первый квест
    startBallAnimation() {
        if (!this.startBallBtn) return;
        
        // Скрываем кнопку и подсказку
        this.startBallBtn.style.display = 'none';
        if (this.startHint) {
            this.startHint.style.display = 'none';
        }
        
        const ball = this.map ? this.map.querySelector('.football-ball') : null;
        if (!ball) return;
        
        const points = this.calculateMapPoints();
        if (!points || points.length === 0) return;
        
        // Первый квест - вратарь справа (номер 1, нечетный, индекс 0)
        const firstQuestPoint = points[0];
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Начальная позиция мяча (в центре поля, внизу)
        const startX = viewportWidth / 2;
        const startY = viewportHeight * 0.8;
        
        // Конечная позиция (первый квест - вратарь справа)
        const endX = firstQuestPoint.x;
        const endY = firstQuestPoint.y;
        
        // НЕ двигаем камеру перед анимацией - оставляем обзор всего поля
        // Камера будет центрирована в startGame
        
        // Устанавливаем начальную позицию мяча
        ball.style.left = (startX - 17.5) + 'px';
        ball.style.top = (startY - 17.5) + 'px';
        ball.style.transition = 'none';
        ball.classList.add('moving');
        
        // Анимация подбрасывания вверх
        setTimeout(() => {
            const midY = viewportHeight * 0.2; // Высшая точка подбрасывания
            ball.style.transition = 'left 1.5s cubic-bezier(0.4, 0, 0.2, 1), top 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            ball.style.left = (endX - 17.5) + 'px';
            ball.style.top = (midY - 17.5) + 'px';
            
            // Падение на первую точку
            setTimeout(() => {
                ball.style.transition = 'left 0.7s cubic-bezier(0.4, 0, 0.2, 1), top 0.7s cubic-bezier(0.4, 0, 0.2, 1)';
                ball.style.left = (endX - 17.5) + 'px';
                ball.style.top = (endY - 17.5) + 'px';
                
                // После падения показываем задание
                setTimeout(() => {
                    ball.classList.remove('moving');
                    // Камера остается статичной
                    this.showScreen('taskScreen');
                    this.startStage();
                }, 700);
            }, 800);
        }, 50);
    }
    
    restoreGame() {
        this.showScreen('mapScreen');
        
        // Обновляем карту и ждём, пока она полностью загрузится
        this.updateMap();
        
        // Увеличенная задержка для гарантии, что карта отрисовалась и камера центрирована
        setTimeout(() => {
            // Камера остается статичной - не двигаем её
            
            // После отрисовки карты показываем задание
            setTimeout(() => {
                this.showScreen('taskScreen');
                this.startStage();
            }, 300);
        }, 800);
    }
    
    showRestoreScreen() {
        if (this.restoreStageNumber) {
            this.restoreStageNumber.textContent = this.currentStage + 1;
        }
        this.showScreen('restoreScreen');
    }
    
    resetProgress() {
        this.currentStage = 0;
        localStorage.removeItem(this.progressKey);
        this.startGame();
    }
    
    // Карта
    initMap() {
        // Карта будет обновляться динамически
    }
    
    updateMap() {
        if (!this.map) {
            console.error('Элемент карты не найден');
            return;
        }
        
        // Предотвращаем множественные одновременные обновления
        if (this.isUpdatingMap) {
            return;
        }
        this.isUpdatingMap = true;
        
        // Задержка для того, чтобы карта успела получить размеры
        // Используем больше времени для гарантии правильной отрисовки
        setTimeout(() => {
            // Очистить карту полностью (удаляем все точки, игроков, мяч)
            // Сохраняем только персонажа, если он есть
            const character = this.map.querySelector('.character');
            const existingPoints = this.map.querySelectorAll('.map-point');
            const existingPlayers = this.map.querySelectorAll('.field-player');
            const existingBall = this.map.querySelector('.football-ball');
            
            // Удаляем все точки, игроков и мяч
            existingPoints.forEach(el => el.remove());
            existingPlayers.forEach(el => el.remove());
            if (existingBall) existingBall.remove();
            
            // Создать путь и точки
            const points = this.calculateMapPoints();
            if (!points || points.length === 0) {
                console.error('Не удалось вычислить точки карты');
                // Пытаемся снова через небольшую задержку
                setTimeout(() => {
                    if (this.map) {
                        this.updateMap();
                    }
                }, 200);
                return;
            }
            
            // Создать игроков на поле (12 штук - по 6 с каждой стороны)
            this.createFieldPlayers();
            
            // Создать мяч
            this.createFootballBall();
            
            // Нарисовать путь (если нужен)
            // this.drawPath(points);
            
            // Нарисовать точки (проверяем уникальность номеров и предотвращаем дублирование)
            const usedNumbers = new Set();
            const createdPoints = new Map(); // Для отслеживания уже созданных точек по номеру
            
            points.forEach((point, index) => {
                // Проверяем, что номер точки уникален
                if (point.number !== undefined) {
                    if (usedNumbers.has(point.number)) {
                        console.error(`[ERROR] ❌ ДУБЛИРОВАНИЕ номера точки: ${point.number} на индексе ${index}! Пропускаем эту точку.`);
                        return; // Пропускаем дубликат
                    }
                    usedNumbers.add(point.number);
                    createdPoints.set(point.number, point);
                }
                
                const pointElement = this.createMapPoint(point, index);
                if (pointElement && this.map) {
                    this.map.appendChild(pointElement);
                }
            });
            
            // Проверяем, что все номера от 1 до 25 присутствуют
            if (usedNumbers.size !== 25) {
                console.warn(`[WARNING] ⚠️ Не все номера присутствуют! Ожидалось 25, найдено ${usedNumbers.size}`);
                const missing = [];
                for (let i = 1; i <= 25; i++) {
                    if (!usedNumbers.has(i)) {
                        missing.push(i);
                    }
                }
                if (missing.length > 0) {
                    console.warn(`[WARNING] Отсутствующие номера: ${missing.join(', ')}`);
                }
                console.log('[INFO] Присутствующие номера:', Array.from(usedNumbers).sort((a, b) => a - b));
            } else {
                console.log(`[OK] ✅ Все 25 номеров присутствуют и уникальны!`);
            }
            
            // Позиционировать персонажа на текущей точке (без анимации)
            const targetPoint = points[this.currentStage] || points[0];
            if (targetPoint && this.character) {
                // Временно убираем transition для мгновенного позиционирования
                const oldTransition = this.character.style.transition;
                this.character.style.transition = 'none';
                this.positionCharacter(targetPoint);
                
                // Восстанавливаем transition
                setTimeout(() => {
                    if (this.character) {
                        this.character.style.transition = oldTransition || '';
                    }
                }, 100);
            }
            
            // Обновить позицию мяча
            this.updateBallPosition();
            
            // Обновить прогресс
            this.updateProgress();
            
            // Камера остается статичной - не двигаем её
            // Снимаем флаг после завершения обновления
            this.isUpdatingMap = false;
        }, 200); // Увеличиваем задержку для гарантии отрисовки
    }
    
    calculateMapPoints() {
        const points = [];
        
        if (!this.map) {
            console.error('Карта не найдена');
            return points;
        }
        
        // Используем реальный размер viewport (это основа для всех расчетов)
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Карта занимает весь экран, используем точные размеры viewport
        const mapWidth = viewportWidth;
        const mapHeight = viewportHeight;
        
        if (mapWidth <= 0 || mapHeight <= 0) {
            console.warn('Некорректные размеры, используем значения по умолчанию');
            // Fallback значения для стандартного экрана 1920x1080
            const defaultWidth = 1920;
            const defaultHeight = 1080;
            return this.calculatePointsWithSize(defaultWidth, defaultHeight);
        }
        
        return this.calculatePointsWithSize(mapWidth, mapHeight);
    }
    
    // Вынесенный метод для расчета точек с конкретными размерами
    // Нечетные справа, четные слева (зеркально)
    calculatePointsWithSize(mapWidth, mapHeight) {
        const points = [];
        
        const centerX = mapWidth / 2;
        const centerY = mapHeight / 2;
        
        // Координаты для позиций (используем для обеих сторон)
        const defendersY = [centerY - mapHeight * 0.15, centerY, centerY + mapHeight * 0.15];
        const midfieldersY = [
            centerY - mapHeight * 0.2,
            centerY - mapHeight * 0.07,
            centerY + mapHeight * 0.07,
            centerY + mapHeight * 0.2
        ];
        const forwardsY = [
            centerY - mapHeight * 0.18,
            centerY - mapHeight * 0.06,
            centerY + mapHeight * 0.06,
            centerY + mapHeight * 0.18
        ];
        
        // Создаем массив для всех 25 точек
        // Нечетные (1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25) - справа
        // Четные (2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24) - слева
        
        let pointIndex = 0;
        
        // Распределяем точки: нечетные справа, четные слева (зеркально)
        // Формируем массивы позиций для каждой стороны
        const rightPositions = []; // Нечетные: 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25
        const leftPositions = [];  // Четные: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24
        
        // Вратари - ограничиваем координаты в пределах поля
        const paddingX = 50;
        const paddingY = 50;
        rightPositions.push({ 
            x: Math.max(paddingX, Math.min(mapWidth - paddingX, mapWidth * 0.92)), 
            y: Math.max(paddingY, Math.min(mapHeight - paddingY, centerY)), 
            z: 0, 
            pos: 'goalkeeper' 
        }); // 1
        leftPositions.push({ 
            x: Math.max(paddingX, Math.min(mapWidth - paddingX, mapWidth * 0.08)), 
            y: Math.max(paddingY, Math.min(mapHeight - paddingY, centerY)), 
            z: 0, 
            pos: 'goalkeeper' 
        });  // 2
        
        // Защитники (по 2 с каждой стороны) - ограничиваем координаты
        rightPositions.push({ 
            x: Math.max(paddingX, Math.min(mapWidth - paddingX, mapWidth * 0.85)), 
            y: Math.max(paddingY, Math.min(mapHeight - paddingY, defendersY[0])), 
            z: 5, 
            pos: 'defender' 
        }); // 3
        leftPositions.push({ 
            x: Math.max(paddingX, Math.min(mapWidth - paddingX, mapWidth * 0.15)), 
            y: Math.max(paddingY, Math.min(mapHeight - paddingY, defendersY[0])), 
            z: 5, 
            pos: 'defender' 
        });  // 4
        rightPositions.push({ 
            x: Math.max(paddingX, Math.min(mapWidth - paddingX, mapWidth * 0.85)), 
            y: Math.max(paddingY, Math.min(mapHeight - paddingY, defendersY[2])), 
            z: 5, 
            pos: 'defender' 
        }); // 5
        leftPositions.push({ 
            x: Math.max(paddingX, Math.min(mapWidth - paddingX, mapWidth * 0.15)), 
            y: Math.max(paddingY, Math.min(mapHeight - paddingY, defendersY[2])), 
            z: 5, 
            pos: 'defender' 
        });  // 6
        
        // Полузащитники (по 4 с каждой стороны) - ограничиваем координаты
        for (let i = 0; i < 4; i++) {
            rightPositions.push({ 
                x: Math.max(paddingX, Math.min(mapWidth - paddingX, mapWidth * 0.75)), 
                y: Math.max(paddingY, Math.min(mapHeight - paddingY, midfieldersY[i])), 
                z: 10, 
                pos: 'midfielder' 
            }); // 7, 9, 11, 13
            leftPositions.push({ 
                x: Math.max(paddingX, Math.min(mapWidth - paddingX, mapWidth * 0.25)), 
                y: Math.max(paddingY, Math.min(mapHeight - paddingY, midfieldersY[i])), 
                z: 10, 
                pos: 'midfielder' 
            });  // 8, 10, 12, 14
        }
        
        // Нападающие (по 4 с каждой стороны) - ограничиваем координаты
        for (let i = 0; i < 4; i++) {
            rightPositions.push({ 
                x: Math.max(paddingX, Math.min(mapWidth - paddingX, mapWidth * 0.62)), 
                y: Math.max(paddingY, Math.min(mapHeight - paddingY, forwardsY[i])), 
                z: 15, 
                pos: 'forward' 
            }); // 15, 17, 19, 21
            leftPositions.push({ 
                x: Math.max(paddingX, Math.min(mapWidth - paddingX, mapWidth * 0.38)), 
                y: Math.max(paddingY, Math.min(mapHeight - paddingY, forwardsY[i])), 
                z: 15, 
                pos: 'forward' 
            });  // 16, 18, 20, 22
        }
        
        // Еще 2 позиции - ограничиваем координаты
        rightPositions.push({ 
            x: Math.max(paddingX, Math.min(mapWidth - paddingX, mapWidth * 0.7)), 
            y: Math.max(paddingY, Math.min(mapHeight - paddingY, centerY - mapHeight * 0.1)), 
            z: 12, 
            pos: 'midfielder' 
        }); // 23
        leftPositions.push({ 
            x: Math.max(paddingX, Math.min(mapWidth - paddingX, mapWidth * 0.3)), 
            y: Math.max(paddingY, Math.min(mapHeight - paddingY, centerY + mapHeight * 0.1)), 
            z: 12, 
            pos: 'midfielder' 
        });  // 24
        
        // Центр поля (25) - финал
        rightPositions.push({ x: centerX, y: centerY, z: 30, pos: 'final' }); // 25
        
        // Проверяем количество элементов в массивах
        console.log(`rightPositions.length = ${rightPositions.length}, должно быть 13`);
        console.log(`leftPositions.length = ${leftPositions.length}, должно быть 12`);
        
        // Теперь создаем точки в правильном порядке: 1, 2, 3, 4, ...
        for (let number = 1; number <= 25; number++) {
            const isOdd = number % 2 === 1;
            let pos;
            
            if (number === 25) {
                // Финал в центре (последний элемент rightPositions, индекс 12)
                if (rightPositions.length < 13) {
                    console.error(`Ошибка: rightPositions.length = ${rightPositions.length}, ожидалось 13`);
                    continue;
                }
                pos = rightPositions[12]; // Явно указываем индекс 12
            } else if (isOdd) {
                // Нечетные справа: 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23
                // Индексы в rightPositions: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
                // Формула: для number=1 → idx=0, для number=3 → idx=1, для number=5 → idx=2, ...
                const idx = Math.floor((number - 1) / 2);
                if (idx >= rightPositions.length - 1) {
                    console.error(`Ошибка индекса для нечетного номера ${number}: idx=${idx}, rightPositions.length=${rightPositions.length}`);
                    continue;
                }
                pos = rightPositions[idx];
            } else {
                // Четные слева: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24
                // Индексы в leftPositions: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
                // Формула: для number=2 → idx=0, для number=4 → idx=1, для number=6 → idx=2, ...
                const idx = Math.floor((number - 2) / 2);
                if (idx >= leftPositions.length) {
                    console.error(`Ошибка индекса для четного номера ${number}: idx=${idx}, leftPositions.length=${leftPositions.length}`);
                    continue;
                }
                pos = leftPositions[idx];
            }
            
            if (!pos) {
                console.error(`Не найдена позиция для номера ${number}`);
                continue;
            }
            
            // Ограничиваем координаты в пределах экрана (дополнительная проверка)
            const finalX = Math.max(paddingX, Math.min(mapWidth - paddingX, pos.x));
            const finalY = Math.max(paddingY, Math.min(mapHeight - paddingY, pos.y));
            
            points.push({
                x: finalX,
                y: finalY,
                z: pos.z,
                index: pointIndex,
                side: isOdd ? 'right' : (number === 25 ? 'center' : 'left'),
                position: pos.pos,
                number: number
            });
            
            pointIndex++;
        }
        
        // Проверяем, что все номера уникальны
        const numbers = points.map(p => p.number).filter(n => n !== undefined);
        const uniqueNumbers = new Set(numbers);
        if (numbers.length !== uniqueNumbers.size) {
            console.error(`Обнаружены дублирующиеся номера! Всего точек: ${numbers.length}, уникальных: ${uniqueNumbers.size}`);
            const duplicates = numbers.filter((n, i) => numbers.indexOf(n) !== i);
            console.error(`Дублирующиеся номера: ${duplicates.join(', ')}`);
        }
        
        if (points.length !== 25) {
            console.error(`Ошибка: создано ${points.length} точек вместо 25!`);
        }
        
        return points;
    }
    
    drawPath(points) {
        if (points.length < 2) return;
        
        for (let i = 0; i < points.length - 1; i++) {
            const start = points[i];
            const end = points[i + 1];
            
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            
            const path = document.createElement('div');
            path.className = 'map-path';
            path.style.width = length + 'px';
            path.style.left = start.x + 'px';
            path.style.top = start.y + 'px';
            path.style.transform = `rotate(${angle}deg)`;
            path.style.transformOrigin = '0 50%';
            
            // Добавляем 3D эффект
            const z = start.z || 10;
            path.style.transform = `rotate(${angle}deg) translateZ(${z}px)`;
            path.style.webkitTransform = `rotate(${angle}deg) translateZ(${z}px)`;
            
            this.map.appendChild(path);
        }
    }
    
    // Создание бетонных плит в начале дорожки
    createStartingPlates(firstPoint) {
        if (!firstPoint) return;
        
        // Создаём несколько плит перед первой точкой
        const plateCount = 5;
        const plateSize = 60;
        
        for (let i = 0; i < plateCount; i++) {
            const plate = document.createElement('div');
            plate.className = 'concrete-plate';
            plate.style.width = plateSize + 'px';
            plate.style.height = plateSize + 'px';
            plate.style.left = (firstPoint.x - plateSize * (plateCount - i) - 20) + 'px';
            plate.style.top = (firstPoint.y - plateSize / 2) + 'px';
            plate.style.zIndex = '1';
            
            // 3D эффект для плит
            const z = 15 + i * 5;
            plate.style.transform = `translateZ(${z}px) rotateX(${5 * i}deg)`;
            plate.style.webkitTransform = `translateZ(${z}px) rotateX(${5 * i}deg)`;
            
            this.map.appendChild(plate);
        }
    }
    
    // Создание 12 игроков на поле (по 6 с каждой стороны)
    createFieldPlayers() {
        if (!this.map) return;
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Позиции игроков (6 слева, 6 справа)
        // Левая сторона (красные)
        const leftPositions = [
            { x: viewportWidth * 0.15, y: viewportHeight * 0.15 }, // Верхний левый
            { x: viewportWidth * 0.15, y: viewportHeight * 0.35 }, // Средний левый верх
            { x: viewportWidth * 0.15, y: viewportHeight * 0.50 }, // Центр левый
            { x: viewportWidth * 0.15, y: viewportHeight * 0.65 }, // Средний левый низ
            { x: viewportWidth * 0.15, y: viewportHeight * 0.85 }, // Нижний левый
            { x: viewportWidth * 0.08, y: viewportHeight * 0.50 }, // Крайний левый (вратарь)
        ];
        
        // Правая сторона (синие)
        const rightPositions = [
            { x: viewportWidth * 0.85, y: viewportHeight * 0.15 }, // Верхний правый
            { x: viewportWidth * 0.85, y: viewportHeight * 0.35 }, // Средний правый верх
            { x: viewportWidth * 0.85, y: viewportHeight * 0.50 }, // Центр правый
            { x: viewportWidth * 0.85, y: viewportHeight * 0.65 }, // Средний правый низ
            { x: viewportWidth * 0.85, y: viewportHeight * 0.85 }, // Нижний правый
            { x: viewportWidth * 0.92, y: viewportHeight * 0.50 }, // Крайний правый (вратарь)
        ];
        
        // Создаём игроков левой стороны (БЕЗ НОМЕРОВ - это декоративные элементы)
        leftPositions.forEach((pos, index) => {
            const player = document.createElement('div');
            player.className = 'field-player left-side';
            // Убираем номера у декоративных игроков - они конфликтуют с номерами точек карты
            // player.textContent = index + 1; // УДАЛЕНО
            player.style.left = (pos.x - 20) + 'px';
            player.style.top = (pos.y - 20) + 'px';
            this.map.appendChild(player);
        });
        
        // Создаём игроков правой стороны (БЕЗ НОМЕРОВ - это декоративные элементы)
        rightPositions.forEach((pos, index) => {
            const player = document.createElement('div');
            player.className = 'field-player right-side';
            // Убираем номера у декоративных игроков - они конфликтуют с номерами точек карты
            // player.textContent = index + 1; // УДАЛЕНО
            player.style.left = (pos.x - 20) + 'px';
            player.style.top = (pos.y - 20) + 'px';
            this.map.appendChild(player);
        });
    }
    
    // Создание мяча
    createFootballBall() {
        if (!this.map) return;
        
        // Удаляем старый мяч, если есть
        const oldBall = this.map.querySelector('.football-ball');
        if (oldBall) {
            oldBall.remove();
        }
        
        const ball = document.createElement('div');
        ball.className = 'football-ball';
        this.map.appendChild(ball);
        
        // Позиционируем мяч в зависимости от текущего этапа
        this.updateBallPosition();
    }
    
    // Обновление позиции мяча в зависимости от этапа
    updateBallPosition() {
        const ball = this.map ? this.map.querySelector('.football-ball') : null;
        if (!ball) return;
        
        const points = this.calculateMapPoints();
        if (!points || points.length === 0) return;
        
        const currentPoint = points[this.currentStage] || points[0];
        
        // Если это начало игры (currentStage = 0), мяч внизу в центре
        if (this.currentStage === 0) {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const ballX = viewportWidth / 2;
            const ballY = viewportHeight * 0.8;
            ball.style.left = (ballX - 17.5) + 'px';
            ball.style.top = (ballY - 17.5) + 'px';
            return;
        }
        
        // Позиционируем мяч у текущего игрока
        ball.style.left = (currentPoint.x - 17.5) + 'px';
        ball.style.top = (currentPoint.y - 17.5) + 'px';
    }
    
    // Анимация перекидывания мяча к конкретному игроку (персонаж бежит за мячом)
    animateBallToPlayer(targetPoint) {
        const ball = this.map ? this.map.querySelector('.football-ball') : null;
        if (!ball || !targetPoint || !this.character) return;
        
        const points = this.calculateMapPoints();
        if (!points || points.length === 0) return;
        
        const currentPoint = points[this.currentStage - 1] || points[0];
        const startX = currentPoint.x;
        const startY = currentPoint.y;
        const endX = targetPoint.x;
        const endY = targetPoint.y;
        
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Вычисляем высоту подбрасывания (зависит от расстояния)
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const maxHeight = Math.min(viewportHeight * 0.25, distance * 0.3); // Максимальная высота подбрасывания
        const midY = Math.min(startY, endY) - maxHeight; // Высшая точка подбрасывания
        
        // Позиционируем персонажа в начальной точке
        this.positionCharacter(currentPoint);
        this.character.classList.add('running');
        
        // Устанавливаем начальную позицию мяча (откуда он летит)
        ball.style.left = (startX - 17.5) + 'px';
        ball.style.top = (startY - 17.5) + 'px';
        ball.style.transition = 'none';
        ball.classList.add('moving');
        
        // Персонаж бежит за мячом (с небольшой задержкой)
        setTimeout(() => {
            const isMobile = window.innerWidth <= 768;
            const characterSize = isMobile ? 25 : 30;
            this.character.style.transition = 'left 2.2s cubic-bezier(0.4, 0, 0.2, 1), top 2.2s cubic-bezier(0.4, 0, 0.2, 1)';
            this.character.style.left = (endX - characterSize / 2) + 'px';
            this.character.style.top = (endY - characterSize / 2) + 'px';
        }, 100);
        
        // Анимация подбрасывания вверх (первая фаза)
        setTimeout(() => {
            // Время подъема зависит от расстояния
            const riseTime = Math.max(0.8, Math.min(1.5, distance / 300));
            ball.style.transition = `left ${riseTime}s cubic-bezier(0.4, 0, 0.2, 1), top ${riseTime * 0.6}s cubic-bezier(0.4, 0, 0.2, 1)`;
            ball.style.left = (endX - 17.5) + 'px';
            ball.style.top = (midY - 17.5) + 'px';
            
            // Падение на целевую точку (вторая фаза)
            setTimeout(() => {
                // Время падения
                const fallTime = Math.max(0.6, Math.min(1.0, distance / 400));
                ball.style.transition = `left ${fallTime}s cubic-bezier(0.4, 0, 0.2, 1), top ${fallTime}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
                ball.style.left = (endX - 17.5) + 'px';
                ball.style.top = (endY - 17.5) + 'px';
                
                // Убираем класс анимации после завершения падения
                setTimeout(() => {
                    ball.classList.remove('moving');
                    if (this.character) {
                        this.character.classList.remove('running');
                    }
                }, fallTime * 1000);
            }, riseTime * 1000);
        }, 50);
    }
    
    createMapPoint(point, index) {
        const pointElement = document.createElement('div');
        pointElement.className = 'map-point';
        
        // Адаптивный размер точки (игрока)
        const isMobile = window.innerWidth <= 768;
        const pointWidth = isMobile ? 30 : 40;
        const pointHeight = isMobile ? 37 : 50;
        
        // Центрируем точку на её координатах (как в map-test.html)
        pointElement.style.left = (point.x - pointWidth / 2) + 'px';
        pointElement.style.top = (point.y - pointHeight / 2) + 'px';
        
        // Показываем правильный номер из данных точки (обязательно используем point.number)
        const pointNumber = point.number !== undefined ? point.number : (index + 1);
        pointElement.textContent = pointNumber;
        pointElement.dataset.pointNumber = pointNumber;
        pointElement.dataset.stageIndex = index; // Сохраняем индекс этапа для отладки
        
        // Определяем сторону из данных точки
        const side = point.side || (point.x < window.innerWidth / 2 ? 'left' : 'right');
        
        // Добавляем класс для стороны
        if (side === 'left') {
            pointElement.classList.add('left-side');
        } else if (side === 'right') {
            pointElement.classList.add('right-side');
        } else {
            pointElement.classList.add('center-side');
        }
        
        // 3D позиционирование точки с учётом Z координаты
        const z = point.z || 20;
        pointElement.style.transform = `translateZ(${z}px)`;
        pointElement.style.webkitTransform = `translateZ(${z}px)`;
        
        // Статус точки
        if (index < this.currentStage) {
            pointElement.classList.add('visited');
        } else if (index === this.currentStage) {
            pointElement.classList.add('active');
        } else if (index === this.currentStage + 1) {
            // Следующая доступная точка - кликабельна
            pointElement.classList.add('next');
            pointElement.style.cursor = 'pointer';
            pointElement.addEventListener('click', () => {
                this.goToStage(index);
            });
        } else {
            // Недоступные точки - показываем саркастическое сообщение при клике
            pointElement.style.cursor = 'not-allowed';
            pointElement.addEventListener('click', () => {
                this.showSarcasticMessage(pointNumber);
            });
        }
        
        return pointElement;
    }
    
    positionCharacter(point) {
        if (!point || !this.character) return;
        
        // Адаптивный размер персонажа
        const isMobile = window.innerWidth <= 768;
        const characterSize = isMobile ? 25 : 30;
        
        // 2D позиционирование (центр персонажа на точке)
        this.character.style.left = (point.x - characterSize / 2) + 'px';
        this.character.style.top = (point.y - characterSize / 2) + 'px';
        
        // 3D позиционирование - персонаж движется в 3D пространстве
        const z = point.z || 50;
        const rotateY = this.getCharacterRotation(point);
        this.character.style.transform = `translateZ(${z}px) rotateY(${rotateY}deg)`;
        this.character.style.webkitTransform = `translateZ(${z}px) rotateY(${rotateY}deg)`;
    }
    
    getCharacterRotation(point) {
        // Поворачиваем персонажа в направлении движения
        // Для простоты - небольшой случайный поворот для живости
        return (point.index || 0) * 15 % 360;
    }
    
    moveCharacter(toPoint) {
        return new Promise((resolve) => {
            if (!this.character || !toPoint) {
                resolve();
                return;
            }
            
            // Адаптивный размер персонажа
            const isMobile = window.innerWidth <= 768;
            const characterSize = isMobile ? 25 : 30;
            
            // Получаем текущую позицию персонажа
            const currentLeft = parseInt(this.character.style.left) || toPoint.x - characterSize / 2;
            const currentTop = parseInt(this.character.style.top) || toPoint.y - characterSize / 2;
            
            // Целевая позиция (центр персонажа на точке)
            const targetLeft = toPoint.x - characterSize / 2;
            const targetTop = toPoint.y - characterSize / 2;
            
            // 3D движение - персонаж движется по Z координате
            const targetZ = toPoint.z || 50;
            const rotateY = this.getCharacterRotation(toPoint);
            
            // Анимация через CSS transition с 3D трансформациями
            this.character.style.transition = `all ${GAME_SETTINGS.characterSpeed}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
            this.character.classList.add('running');
            this.character.style.left = targetLeft + 'px';
            this.character.style.top = targetTop + 'px';
            this.character.style.transform = `translateZ(${targetZ}px) rotateY(${rotateY}deg)`;
            this.character.style.webkitTransform = `translateZ(${targetZ}px) rotateY(${rotateY}deg)`;
            
            // Камера остается статичной - не двигаем её за персонажем
            
            setTimeout(() => {
                if (this.character) {
                    this.character.classList.remove('running');
                    // Убираем transition после завершения для мгновенного позиционирования в будущем
                    setTimeout(() => {
                        if (this.character) {
                            this.character.style.transition = '';
                        }
                    }, 100);
                }
                resolve();
            }, GAME_SETTINGS.characterSpeed);
        });
    }
    
    moveCamera(toPoint, instant = false) {
        // Движение камеры (контейнера карты) для следования за персонажем
        const mapContainer = document.querySelector('.map-container');
        if (!mapContainer || !toPoint) return;
        
        // Используем реальный размер viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Вычисляем смещение для центрирования точки в viewport
        // Точка находится на карте, её координаты относительно карты
        // Чтобы центрировать точку, нужно сместить карту так, чтобы точка оказалась в центре viewport
        const offsetX = -toPoint.x + viewportWidth / 2;
        const offsetY = -toPoint.y + viewportHeight / 2;
        
        // Убираем все предыдущие трансформации, чтобы избежать накопления
        mapContainer.style.transform = '';
        mapContainer.style.webkitTransform = '';
        
        // Если instant = true, перемещаем мгновенно (без анимации)
        if (instant) {
            mapContainer.style.transition = 'none';
            // Используем translate3d для лучшей производительности
            mapContainer.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
            mapContainer.style.webkitTransform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
            // Восстанавливаем transition после мгновенного перемещения
            setTimeout(() => {
                if (mapContainer) {
                    mapContainer.style.transition = 'transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                }
            }, 50);
        } else {
            mapContainer.style.transition = 'transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            mapContainer.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
            mapContainer.style.webkitTransform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
        }
    }
    
    updateProgress() {
        if (this.progressText) {
            this.progressText.textContent = `Этап ${this.currentStage + 1} из ${this.totalStages}`;
        }
    }
    
    // Этапы
    startStage() {
        if (this.currentStage >= this.totalStages) {
            this.showFinalScreen();
            return;
        }
        
        const stage = GAME_CONFIG.stages[this.currentStage];
        if (!stage) {
            console.error('Этап не найден:', this.currentStage);
            this.handleError('Этап не найден');
            return;
        }
        
        // Показываем задание сразу (не показываем карту перед заданием)
        this.updateProgress();
        
        // Небольшая задержка перед показом задания
        setTimeout(() => {
            if (stage.type === 'question') {
                this.showQuestion(stage);
            } else if (stage.type === 'action') {
                this.showAction(stage);
            } else {
                console.error('Неизвестный тип этапа:', stage.type);
                this.handleError('Неизвестный тип этапа');
            }
        }, 500);
    }
    
    showQuestion(stage) {
        this.showScreen('taskScreen');
        this.taskTitle.textContent = 'Вопрос:';
        
        const questionText = document.createElement('p');
        questionText.className = 'question-text';
        questionText.style.fontSize = '1.3rem';
        questionText.style.marginBottom = '20px';
        questionText.textContent = stage.question;
        
        this.taskBody.innerHTML = '';
        this.taskBody.appendChild(questionText);
        
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'question-options';
        
        stage.options.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = option;
            btn.addEventListener('click', () => this.selectAnswer(index, stage));
            optionsContainer.appendChild(btn);
        });
        
        this.taskBody.appendChild(optionsContainer);
        this.taskFeedback.className = 'task-feedback hidden';
        this.continueBtn.classList.add('hidden');
    }
    
    selectAnswer(selectedIndex, stage) {
        // Отключить все кнопки
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.disabled = true;
            btn.style.cursor = 'not-allowed';
        });
        
        // Подсветить выбранный ответ
        const buttons = document.querySelectorAll('.option-btn');
        buttons[selectedIndex].classList.add('selected');
        
        const isCorrect = selectedIndex === stage.correctAnswer;
        
        // Показать правильные/неправильные ответы
        buttons.forEach((btn, index) => {
            if (index === stage.correctAnswer) {
                btn.classList.add('correct');
            } else if (index === selectedIndex && !isCorrect) {
                btn.classList.add('wrong');
            }
        });
        
        // Показать обратную связь
        this.taskFeedback.className = `task-feedback ${isCorrect ? 'success' : 'funny'}`;
        this.taskFeedback.textContent = isCorrect ? stage.correctFeedback : stage.wrongFeedback;
        this.continueBtn.classList.remove('hidden');
        
        // Воспроизвести звук
        if (isCorrect) {
            this.playSound('goal');
        }
    }
    
    showAction(stage) {
        this.showScreen('taskScreen');
        this.taskTitle.textContent = stage.title || 'Задание';
        
        const description = document.createElement('p');
        description.className = 'action-description';
        description.style.fontSize = '1.2rem';
        description.style.marginBottom = '20px';
        description.textContent = stage.description || '';
        
        this.taskBody.innerHTML = '';
        this.taskBody.appendChild(description);
        
        switch (stage.actionType) {
            case 'button':
                this.showButtonAction(stage);
                break;
            case 'penalty':
                this.showPenaltyAction(stage);
                break;
            case 'selectItem':
                this.showSelectItemAction(stage);
                break;
            case 'selectPlace':
                this.showSelectPlaceAction(stage);
                break;
            default:
                this.showButtonAction(stage);
        }
        
        this.taskFeedback.className = 'task-feedback hidden';
        this.continueBtn.classList.add('hidden');
    }
    
    showButtonAction(stage) {
        const btn = document.createElement('button');
        btn.className = 'action-btn';
        btn.textContent = stage.buttonText || 'Продолжить';
        btn.addEventListener('click', () => this.completeAction(stage));
        this.taskBody.appendChild(btn);
    }
    
    showPenaltyAction(stage) {
        const penaltyContainer = document.createElement('div');
        penaltyContainer.className = 'penalty-game';
        
        const goalArea = document.createElement('div');
        goalArea.className = 'goal-area';
        goalArea.dataset.penaltyCompleted = 'false';
        
        // Обработка и кликов, и касаний для мобильных устройств
        const handlePenalty = (e) => {
            // Для touch-событий используем touches, для mouse - clientX/Y
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            // Создаём новое событие с правильными координатами
            const syntheticEvent = {
                clientX: clientX,
                clientY: clientY,
                currentTarget: e.currentTarget,
                preventDefault: () => e.preventDefault()
            };
            
            this.handlePenaltyClick(syntheticEvent, stage);
            e.preventDefault(); // Предотвращаем двойное срабатывание
        };
        
        goalArea.addEventListener('click', handlePenalty);
        goalArea.addEventListener('touchstart', handlePenalty, { passive: false });
        
        const goal = document.createElement('div');
        goal.className = 'goal';
        
        // Добавляем подсказку
        const hint = document.createElement('p');
        hint.style.marginTop = '10px';
        hint.style.fontSize = '1rem';
        hint.style.textAlign = 'center';
        hint.style.color = '#666';
        const isMobile = window.innerWidth <= 768;
        hint.textContent = isMobile ? 'Нажмите в ворота, чтобы пробить пенальти' : 'Кликните в ворота, чтобы пробить пенальти';
        
        goalArea.appendChild(goal);
        penaltyContainer.appendChild(goalArea);
        penaltyContainer.appendChild(hint);
        this.taskBody.appendChild(penaltyContainer);
    }
    
    handlePenaltyClick(event, stage) {
        // Предотвращаем множественные клики
        const goalArea = event.currentTarget;
        if (goalArea.dataset.penaltyCompleted === 'true') {
            return;
        }
        goalArea.dataset.penaltyCompleted = 'true';
        
        const rect = goalArea.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        
        // Проверка попадания в ворота (примерная область)
        const goalX = rect.width / 2 - 100;
        const goalY = rect.height - 80;
        const goalWidth = 200;
        const goalHeight = 80;
        
        const hit = clickX >= goalX && clickX <= goalX + goalWidth && 
                   clickY >= goalY && clickY <= goalY + goalHeight;
        
        // Показываем мяч в любом случае
        this.showBall(goalArea, clickX, clickY);
        
        if (hit) {
            this.playSound('goal');
            this.playSound('applause');
            this.completeAction(stage);
        } else {
            // Даже если промах, продолжаем (по условию ТЗ - правильность не критична)
            setTimeout(() => {
                this.completeAction({
                    ...stage,
                    feedback: 'Почти попал! Но это не страшно, продолжаем! ⚽'
                });
            }, 500);
        }
    }
    
    showBall(container, x, y) {
        const ball = document.createElement('div');
        ball.className = 'ball';
        ball.style.left = x - 20 + 'px';
        ball.style.top = y - 20 + 'px';
        ball.style.display = 'block';
        container.appendChild(ball);
        
        // Анимация полёта мяча к воротам
        setTimeout(() => {
            const rect = container.getBoundingClientRect();
            const goalX = rect.width / 2;
            const goalY = rect.height - 40;
            ball.style.transition = 'all 0.5s ease';
            ball.style.left = goalX - 20 + 'px';
            ball.style.top = goalY - 20 + 'px';
        }, 50);
    }
    
    showSelectItemAction(stage) {
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'items-grid';
        itemsContainer.dataset.completed = 'false';
        
        if (!stage.items || !Array.isArray(stage.items)) {
            console.error('Элементы для выбора не найдены в этапе');
            this.completeAction(stage);
            return;
        }
        
        stage.items.forEach((item, index) => {
            const itemCard = document.createElement('div');
            itemCard.className = 'item-card';
            
            const emoji = document.createElement('div');
            emoji.className = 'item-emoji';
            emoji.textContent = item.emoji || '❓';
            
            const name = document.createElement('div');
            name.textContent = item.name || 'Элемент';
            
            itemCard.appendChild(emoji);
            itemCard.appendChild(name);
            
            itemCard.addEventListener('click', () => {
                // Предотвращаем повторные клики
                if (itemsContainer.dataset.completed === 'true') {
                    return;
                }
                
                // Убрать выделение с других
                itemsContainer.querySelectorAll('.item-card').forEach(card => {
                    card.classList.remove('selected');
                });
                
                // Выделить выбранный
                itemCard.classList.add('selected');
                
                // Отмечаем как завершённое
                itemsContainer.dataset.completed = 'true';
                
                // Если правильный ответ
                if (item.correct) {
                    setTimeout(() => {
                        this.playSound('goal');
                        this.completeAction(stage);
                    }, 300);
                } else {
                    // Неправильный ответ - всё равно продолжаем (по ТЗ)
                    setTimeout(() => {
                        this.completeAction({
                            ...stage,
                            feedback: stage.feedback || 'Не угадал, но это не страшно! Продолжаем! 😊'
                        });
                    }, 500);
                }
            });
            
            itemsContainer.appendChild(itemCard);
        });
        
        this.taskBody.appendChild(itemsContainer);
    }
    
    showSelectPlaceAction(stage) {
        const placesContainer = document.createElement('div');
        placesContainer.className = 'question-options';
        placesContainer.dataset.completed = 'false';
        
        if (!stage.places || !Array.isArray(stage.places)) {
            console.error('Места для выбора не найдены в этапе');
            this.completeAction(stage);
            return;
        }
        
        stage.places.forEach((place, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = place.name || 'Место';
            
            btn.addEventListener('click', () => {
                // Предотвращаем повторные клики
                if (placesContainer.dataset.completed === 'true') {
                    return;
                }
                
                // Убрать выделение с других
                placesContainer.querySelectorAll('.option-btn').forEach(b => {
                    b.classList.remove('selected');
                });
                
                // Выделить выбранный
                btn.classList.add('selected');
                
                // Отмечаем как завершённое
                placesContainer.dataset.completed = 'true';
                
                // Если правильный ответ
                if (place.correct) {
                    setTimeout(() => {
                        this.playSound('goal');
                        this.completeAction(stage);
                    }, 300);
                } else {
                    // Неправильный ответ - всё равно продолжаем (по ТЗ)
                    setTimeout(() => {
                        this.completeAction({
                            ...stage,
                            feedback: stage.feedback || 'Не угадал, но это не страшно! Продолжаем! 😊'
                        });
                    }, 500);
                }
            });
            
            placesContainer.appendChild(btn);
        });
        
        this.taskBody.appendChild(placesContainer);
    }
    
    completeAction(stage) {
        this.taskFeedback.className = `task-feedback ${stage.feedback ? 'success' : 'funny'}`;
        this.taskFeedback.textContent = stage.feedback || 'Отлично! Продолжаем!';
        this.continueBtn.classList.remove('hidden');
    }
    
    showContentModal() {
        // Проверяем, что элементы модального окна существуют
        if (!this.modalTitle || !this.modalBody || !this.modalDescription || !this.contentModal) {
            console.error('Элементы модального окна не найдены');
            // Если модальное окно сломано, просто продолжаем
            this.nextStage();
            return;
        }
        
        const content = GAME_CONFIG.stageContent[this.currentStage];
        
        if (!content) {
            // Если контента нет, просто продолжаем
            console.warn('Контент для этапа', this.currentStage, 'не найден');
            // Не переходим автоматически, показываем карту
            this.showMapAfterContent();
            return;
        }
        
        this.modalTitle.textContent = content.title || 'Памятный момент';
        this.modalDescription.textContent = content.description || content.content || '';
        
        this.modalBody.innerHTML = '';
        
        try {
            if (content.type === 'image' && content.imagePath) {
                const img = document.createElement('img');
                img.src = content.imagePath;
                img.alt = content.title || 'Изображение';
                // Стили для полноэкранного отображения
                img.style.cssText = 'max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain;';
                img.onerror = () => this.handleImageError(img);
                img.onload = () => this.hideLoader();
                this.showLoader();
                this.modalBody.appendChild(img);
            } else if (content.type === 'video' && content.videoPath) {
                const video = document.createElement('video');
                video.src = content.videoPath;
                video.controls = true;
                video.preload = 'metadata';
                // Стили для полноэкранного отображения
                video.style.cssText = 'max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain;';
                video.onloadeddata = () => this.hideLoader();
                // Обработчик ошибки загрузки
                video.addEventListener('error', () => {
                    this.handleVideoError(video);
                });
                this.showLoader();
                this.modalBody.appendChild(video);
            } else {
                // Текстовый контент (по умолчанию)
                const textContent = document.createElement('p');
                textContent.style.cssText = 'font-size: 1.3rem; text-align: center; padding: 20px; background: #f0f0f0; border-radius: 10px; line-height: 1.8; max-width: 100%; word-wrap: break-word;';
                textContent.textContent = content.content || content.description || 'Памятный момент';
                this.modalBody.appendChild(textContent);
                this.hideLoader();
            }
        } catch (error) {
            console.error('Ошибка загрузки контента:', error);
            this.handleMediaError('content');
            // Показать текстовую заглушку
            const fallbackText = document.createElement('p');
            fallbackText.style.padding = '20px';
            fallbackText.style.textAlign = 'center';
            fallbackText.style.background = '#f0f0f0';
            fallbackText.style.borderRadius = '10px';
            fallbackText.textContent = content.content || content.description || 'Контент временно недоступен';
            this.modalBody.appendChild(fallbackText);
            this.hideLoader();
        }
        
        this.contentModal.classList.remove('hidden');
    }
    
    closeModal() {
        if (this.contentModal) {
            this.contentModal.classList.add('hidden');
        }
        this.hideLoader();
    }
    
    // Показываем карту после просмотра контента (без автоматического перехода)
    showMapAfterContent() {
        this.closeModal();
        this.showScreen('mapScreen');
        this.updateMap();
        // Запускаем подсказку через 10 секунд
        this.startHintTimer();
    }
    
    // Инициализация подсказок
    startHintTimer() {
        // Останавливаем предыдущий таймер если есть
        if (this.hintTimer) {
            clearTimeout(this.hintTimer);
        }
        
        // Если не на финальном этапе, запускаем таймер подсказки
        if (this.currentStage < this.totalStages - 1) {
            this.hintTimer = setTimeout(() => {
                this.showHint();
            }, 10000); // 10 секунд
        }
    }
    
    stopHintTimer() {
        if (this.hintTimer) {
            clearTimeout(this.hintTimer);
            this.hintTimer = null;
        }
        this.hideHint();
    }
    
    showHint() {
        // Скрываем предыдущую подсказку, если есть
        this.hideHint();
        
        const points = this.calculateMapPoints();
        if (!points || points.length === 0) return;
        
        const nextPointIndex = this.currentStage + 1;
        if (nextPointIndex >= points.length) return;
        
        const nextPoint = points[nextPointIndex];
        if (!nextPoint) return;
        
        // Находим элемент точки на карте
        const mapPoints = this.map.querySelectorAll('.map-point');
        if (!mapPoints || mapPoints.length <= nextPointIndex) return;
        
        const nextPointElement = Array.from(mapPoints).find(
            point => parseInt(point.dataset.stageIndex) === nextPointIndex
        );
        
        if (!nextPointElement) {
            // Если не нашли по индексу, пробуем по номеру точки
            const pointByNumber = Array.from(mapPoints).find(
                point => parseInt(point.dataset.pointNumber) === nextPoint.number
            );
            if (!pointByNumber) return;
            nextPointElement = pointByNumber;
        }
        
        // Подсвечиваем следующую точку
        nextPointElement.classList.add('hint-highlight');
        
        // Создаём подсказку
        const hintElement = document.createElement('div');
        hintElement.className = 'hint-popup';
        hintElement.id = 'hintPopup';
        hintElement.innerHTML = `
            <div class="hint-content">
                <p>Попробуй нажать сюда, деревенский! 👆</p>
            </div>
            <div class="hint-arrow"></div>
        `;
        
        // Позиционируем подсказку относительно точки на карте
        // Используем координаты точки, но с учетом смещения для правильного отображения
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const isMobile = viewportWidth <= 768;
        
        // Адаптивное позиционирование с учетом границ экрана
        let offsetX = isMobile ? 50 : 60; // Смещение справа от точки
        let offsetY = isMobile ? -40 : -30; // Смещение вверх от точки
        
        // Если точка справа, подсказка слева
        if (nextPoint.x > viewportWidth / 2) {
            offsetX = isMobile ? -180 : -220; // Смещение слева
            // Меняем стрелку на другую сторону
            hintElement.innerHTML = `
                <div class="hint-content">
                    <p>Попробуй нажать сюда, деревенский! 👆</p>
                </div>
                <div class="hint-arrow hint-arrow-right"></div>
            `;
        }
        
        // Проверяем границы по вертикали
        if (nextPoint.y < 100) {
            offsetY = 50; // Если точка сверху, подсказка снизу
        } else if (nextPoint.y > viewportHeight - 100) {
            offsetY = -80; // Если точка снизу, подсказка сверху
        }
        
        hintElement.style.left = (nextPoint.x + offsetX) + 'px';
        hintElement.style.top = (nextPoint.y + offsetY) + 'px';
        
        // Добавляем обработчик клика для закрытия подсказки
        hintElement.addEventListener('click', () => {
            this.hideHint();
        });
        
        this.map.appendChild(hintElement);
        
        // Анимация появления
        setTimeout(() => {
            hintElement.classList.add('visible');
        }, 50);
        
        // Через 10 секунд увеличиваем цифру и показываем дополнительную подсказку
        setTimeout(() => {
            if (!nextPointElement || !nextPointElement.parentNode) return;
            
            // Увеличиваем размер цифры на точке (адаптивно)
            const isMobile = window.innerWidth <= 768;
            const fontSize = isMobile ? '20px' : '28px';
            const scale = isMobile ? 1.8 : 2.2;
            
            nextPointElement.style.fontSize = fontSize;
            nextPointElement.style.fontWeight = '900';
            nextPointElement.style.transform = `translateZ(70px) scale(${scale})`;
            nextPointElement.style.webkitTransform = `translateZ(70px) scale(${scale})`;
            nextPointElement.style.zIndex = '200';
            nextPointElement.style.transition = 'all 0.5s ease';
            nextPointElement.style.textShadow = '0 0 15px rgba(255, 215, 0, 0.8), 0 0 30px rgba(255, 215, 0, 0.6)';
            
            // Создаём всплывающую подсказку
            const warningHint = document.createElement('div');
            warningHint.className = 'warning-hint-popup';
            warningHint.id = 'warningHintPopup';
            warningHint.innerHTML = `
                <div class="warning-hint-content">
                    <p>Если ты не выучишь порядок, я расскажу что общего между тобой и кухонной утварью</p>
                </div>
            `;
            
            // Позиционируем подсказку рядом с цифрой (адаптивно)
            const warningOffsetX = isMobile ? offsetX + 30 : offsetX + 80;
            const warningOffsetY = isMobile ? offsetY - 60 : offsetY - 90;
            
            warningHint.style.left = (nextPoint.x + warningOffsetX) + 'px';
            warningHint.style.top = (nextPoint.y + warningOffsetY) + 'px';
            
            this.map.appendChild(warningHint);
            
            // Анимация появления
            setTimeout(() => {
                warningHint.classList.add('visible');
            }, 50);
            
            // Сохраняем ссылку для удаления
            this.warningHint = warningHint;
            
        }, 10000); // 10 секунд
        
        // Автоматически скрываем подсказку через 25 секунд (15 секунд после предупреждения)
        setTimeout(() => {
            if (hintElement && hintElement.parentNode) {
                this.hideHint();
            }
        }, 25000);
    }
    
    hideHint() {
        const hintElement = document.getElementById('hintPopup');
        if (hintElement) {
            hintElement.classList.remove('visible');
            setTimeout(() => {
                hintElement.remove();
            }, 300);
        }
        
        // Убираем предупреждающую подсказку
        const warningHint = document.getElementById('warningHintPopup');
        if (warningHint) {
            warningHint.classList.remove('visible');
            setTimeout(() => {
                warningHint.remove();
            }, 300);
        }
        
        // Убираем подсветку и возвращаем нормальный размер точек
        const highlighted = this.map.querySelectorAll('.map-point.hint-highlight');
        highlighted.forEach(point => {
            point.classList.remove('hint-highlight');
            // Возвращаем нормальный размер
            point.style.fontSize = '';
            point.style.fontWeight = '';
            point.style.transform = '';
            point.style.webkitTransform = '';
            point.style.zIndex = '';
            point.style.transition = '';
        });
    }
    
    // Саркастические сообщения при попытке кликнуть не на ту точку
    showSarcasticMessage(pointNumber) {
        // Правильный следующий этап - это currentStage + 1 (потому что currentStage это индекс, а этапы с 1)
        const nextStage = this.currentStage + 1;
        
        const messages = [
            `Деревенский, ты считать разучился? Сейчас ${nextStage} этап, а не ${pointNumber}!`,
            `Эй, счетовод! Нужно пройти ${nextStage} этап, а не ${pointNumber}!`,
            `Считать не умеешь? Следующий этап - ${nextStage}, а не ${pointNumber}!`,
            `Деревенский, порядок нарушил! Сейчас ${nextStage} этап!`,
            `Куда лезешь? Сейчас ${nextStage} этап, а ты на ${pointNumber}!`,
            `Последовательность, братан! Сейчас ${nextStage} этап, потом ${pointNumber}!`,
            `Ты что, считать не умеешь? Нужен этап ${nextStage}, а не ${pointNumber}!`
        ];
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        
        // Показываем временное сообщение
        const messageEl = document.createElement('div');
        messageEl.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(220, 20, 60, 0.95);
            color: white;
            padding: 20px 30px;
            border-radius: 15px;
            border: 3px solid #FFD700;
            font-size: 1.2rem;
            font-weight: bold;
            text-align: center;
            z-index: 10000;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7);
            animation: messagePulse 0.3s ease;
        `;
        messageEl.textContent = message;
        document.body.appendChild(messageEl);
        
        // Удаляем через 3 секунды
        setTimeout(() => {
            messageEl.style.animation = 'messageFadeOut 0.3s ease';
            setTimeout(() => {
                messageEl.remove();
            }, 300);
        }, 3000);
    }
    
    // Клик по точке на карте (интерактивное управление)
    goToStage(targetStage) {
        // Можно идти только на следующий этап
        if (targetStage !== this.currentStage + 1 || targetStage >= this.totalStages) {
            // Показываем саркастическое сообщение
            const points = this.calculateMapPoints();
            if (points && points[targetStage]) {
                const pointNumber = points[targetStage].number || (targetStage + 1);
                this.showSarcasticMessage(pointNumber);
            }
            return;
        }
        
        // Останавливаем подсказку
        this.stopHintTimer();
        
        // Проверяем на финальный этап
        if (targetStage >= this.totalStages) {
            this.showFinalScreen();
            return;
        }
        
        // Получаем точки для определения позиций мяча и перемещения персонажа
        const points = this.calculateMapPoints();
        if (!points || points.length === 0) {
            this.showScreen('taskScreen');
            this.startStage();
            return;
        }
        
        const currentPoint = points[this.currentStage];
        const nextPoint = points[targetStage];
        
        // Обновляем текущий этап
        this.currentStage = targetStage;
        this.saveProgress();
        
        // Показываем карту для движения персонажа и мяча
        this.showScreen('mapScreen');
        this.updateMap();
        
        // Анимируем перекидывание мяча к следующему игроку (персонаж бежит за мячом)
        // Делаем это после обновления карты, чтобы все элементы были на месте
        setTimeout(() => {
            this.animateBallToPlayer(nextPoint);
            
            // После завершения анимации показываем задание
            setTimeout(() => {
                this.showScreen('taskScreen');
                this.startStage();
            }, 1300);
        }, 300);
    }
    
    nextStage() {
        // Этот метод теперь не используется для автоматического перехода
        // Вместо него используется goToStage или showMapAfterContent
        this.showMapAfterContent();
    }
    
    showFinalScreen() {
        this.saveProgress({ completed: true });
        this.showScreen('finalScreen');
        this.createConfetti();
        
        const final = GAME_CONFIG.finalContent;
        if (!final) {
            console.error('Финальный контент не найден в конфигурации');
            if (this.finalContent) {
                this.finalContent.innerHTML = '<h3>🎉 Поздравляем с 30-летием! 🎉</h3><p>Вы прошли весь квест!</p>';
            }
            return;
        }
        
        if (this.finalContent) {
            this.finalContent.innerHTML = `
                <h3 style="font-size: 1.8rem; margin-bottom: 20px; color: var(--primary-red);">${final.title || '🎉 Поздравляем! 🎉'}</h3>
                <p style="font-size: 1.2rem; line-height: 1.8; margin-bottom: 15px;">${final.text || 'Вы прошли весь квест!'}</p>
                <p style="font-size: 1.1rem; line-height: 1.8; margin-bottom: 15px;">${final.description || ''}</p>
                <p style="font-size: 1.1rem; line-height: 1.8; margin-bottom: 15px; font-weight: 700;">${final.message || ''}</p>
                <p style="font-size: 1.3rem; margin-top: 30px; font-weight: 700; color: var(--primary-red);">${final.ending || 'С любовью! ❤️'}</p>
            `;
        }
        
        this.playSound('applause');
    }
    
    createConfetti() {
        if (!this.confettiContainer) {
            console.warn('Контейнер конфетти не найден');
            return;
        }
        
        const colors = ['#FFD700', '#FF6347', '#32CD32', '#4169E1', '#FF1493'];
        
        for (let i = 0; i < 100; i++) {
            setTimeout(() => {
                if (!this.confettiContainer) return;
                
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.top = '-10px';
                confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = Math.random() * 3 + 's';
                confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
                
                try {
                    this.confettiContainer.appendChild(confetti);
                    
                    // Удаляем конфетти через 5 секунд
                    setTimeout(() => {
                        if (confetti.parentNode) {
                            confetti.remove();
                        }
                    }, 5000);
                } catch (error) {
                    console.warn('Ошибка создания конфетти:', error);
                }
            }, i * 50);
        }
    }
    
    // Музыка и звуки
    toggleMusic() {
        if (!this.backgroundMusic) {
            console.error('Элемент музыки не найден');
            return;
        }
        
        if (!this.isMusicEnabled) {
            // Включаем музыку
            this.isMusicEnabled = true;
            this.isMusicPlaying = true;
            
            // Убеждаемся, что трек загружен
            if (!this.backgroundMusic.src || this.backgroundMusic.src === window.location.href) {
                this.loadTrack(this.currentTrackIndex);
            }
            
            // Пробуем запустить музыку
            const playPromise = this.backgroundMusic.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        // Музыка успешно запущена
                        this.isMusicPlaying = true;
                        this.updateMusicIcons(true);
                        console.log('Музыка запущена:', this.musicTracks[this.currentTrackIndex]);
                    })
                    .catch(error => {
                        console.error('Ошибка воспроизведения музыки:', error);
                        this.handleMediaError('music');
                        // Пробуем загрузить другой трек
                        if (this.musicTracks.length > 1) {
                            this.currentTrackIndex = (this.currentTrackIndex + 1) % this.musicTracks.length;
                            this.loadTrack(this.currentTrackIndex);
                            setTimeout(() => {
                                this.backgroundMusic.play().catch(e => {
                                    console.error('Не удалось запустить музыку:', e);
                                });
                            }, 500);
                        }
                    });
            }
        } else {
            // Музыка уже была включена - переключаем play/pause
            if (this.isMusicPlaying) {
                this.backgroundMusic.pause();
                this.isMusicPlaying = false;
                this.updateMusicIcons(false);
            } else {
                // Продолжаем воспроизведение
                const playPromise = this.backgroundMusic.play();
                
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            this.isMusicPlaying = true;
                            this.updateMusicIcons(true);
                        })
                        .catch(error => {
                            console.error('Ошибка воспроизведения музыки:', error);
                            this.handleMediaError('music');
                        });
                }
            }
        }
    }
    
    updateMusicIcons(playing) {
        const icon = playing ? '🔊' : '🔇';
        const musicIcon = document.getElementById('musicIcon');
        const musicIconMap = document.getElementById('musicIconMap');
        
        if (musicIcon) musicIcon.textContent = icon;
        if (musicIconMap) musicIconMap.textContent = icon;
    }
    
    playSound(soundType) {
        if (!this.isMusicEnabled) return;
        
        try {
            let sound;
            switch (soundType) {
                case 'goal':
                    sound = this.goalSound;
                    break;
                case 'applause':
                    sound = this.applauseSound;
                    break;
                default:
                    return;
            }
            
            if (sound && sound.src) {
                sound.currentTime = 0;
                sound.play().catch(error => {
                    console.error('Ошибка воспроизведения звука:', error);
                    // Игнорируем ошибку, чтобы не ломать игру
                });
            }
        } catch (error) {
            console.error('Ошибка звука:', error);
            // Игнорируем ошибку, чтобы не ломать игру
        }
    }
    
    // Сохранение прогресса
    saveProgress(data = {}) {
        // Проверяем доступность localStorage
        if (!this.isLocalStorageAvailable()) {
            console.warn('localStorage недоступен, прогресс не будет сохранён');
            return;
        }
        
        try {
            const progress = {
                stage: this.currentStage,
                timestamp: Date.now(),
                ...data
            };
            localStorage.setItem(this.progressKey, JSON.stringify(progress));
        } catch (error) {
            console.error('Ошибка сохранения прогресса:', error);
            // Если хранилище переполнено, пытаемся очистить старые данные
            try {
                localStorage.clear();
                localStorage.setItem(this.progressKey, JSON.stringify({
                    stage: this.currentStage,
                    timestamp: Date.now(),
                    ...data
                }));
            } catch (clearError) {
                console.error('Не удалось сохранить прогресс даже после очистки:', clearError);
                // Игнорируем ошибку, чтобы не ломать игру
            }
        }
    }
    
    loadProgress() {
        // Проверяем доступность localStorage
        if (!this.isLocalStorageAvailable()) {
            console.warn('localStorage недоступен, начинаем с начала');
            this.currentStage = 0;
            return;
        }
        
        try {
            const saved = localStorage.getItem(this.progressKey);
            if (saved) {
                const progress = JSON.parse(saved);
                // Проверяем валидность данных
                if (progress && typeof progress.stage === 'number') {
                    if (progress.completed) {
                        // Игра пройдена, начинаем заново
                        this.currentStage = 0;
                        try {
                            localStorage.removeItem(this.progressKey);
                        } catch (e) {
                            // Игнорируем ошибку удаления
                        }
                    } else {
                        // Проверяем, что этап в допустимых пределах
                        this.currentStage = Math.max(0, Math.min(this.totalStages - 1, progress.stage || 0));
                    }
                } else {
                    // Некорректные данные, начинаем с начала
                    this.currentStage = 0;
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки прогресса:', error);
            // При ошибке начинаем с начала
            this.currentStage = 0;
        }
    }
    
    // Проверка доступности localStorage
    isLocalStorageAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    // Обработка ошибок
    showLoader() {
        this.loader.classList.remove('hidden');
    }
    
    hideLoader() {
        this.loader.classList.add('hidden');
    }
    
    handleMediaError(type) {
        console.warn(`Ошибка загрузки медиа: ${type}`);
        
        // Не ломаем игру, просто продолжаем
        this.hideLoader();
        
        // Для музыки просто отключаем кнопку
        if (type === 'music') {
            const musicBtn = document.getElementById('musicToggleBtn');
            const musicBtnMap = document.getElementById('musicToggleBtnMap');
            if (musicBtn) {
                musicBtn.disabled = true;
                musicBtn.style.opacity = '0.5';
                musicBtn.title = 'Музыка недоступна';
            }
            if (musicBtnMap) {
                musicBtnMap.disabled = true;
                musicBtnMap.style.opacity = '0.5';
                musicBtnMap.title = 'Музыка недоступна';
            }
        }
    }
    
    handleImageError(img) {
        img.onerror = null; // Предотвратить бесконечный цикл
        img.style.display = 'none';
        
        const errorMsg = document.createElement('p');
        errorMsg.style.padding = '20px';
        errorMsg.style.textAlign = 'center';
        errorMsg.style.background = '#f0f0f0';
        errorMsg.style.borderRadius = '10px';
        errorMsg.textContent = 'Фото временно недоступно';
        
        img.parentNode.appendChild(errorMsg);
        this.hideLoader();
    }
    
    handleVideoError(video) {
        video.onerror = null;
        video.style.display = 'none';
        
        const errorMsg = document.createElement('p');
        errorMsg.style.padding = '20px';
        errorMsg.style.textAlign = 'center';
        errorMsg.style.background = '#f0f0f0';
        errorMsg.style.borderRadius = '10px';
        errorMsg.textContent = 'Видео временно недоступно';
        
        video.parentNode.appendChild(errorMsg);
        this.hideLoader();
    }
    
    handleError(message) {
        console.error('Ошибка игры:', message);
        
        // Не показываем alert пользователю - это может быть слишком навязчиво
        // Вместо этого пытаемся восстановить игру
        
        // Сбрасываем прогресс на безопасное место (предыдущий этап)
        if (this.currentStage > 0) {
            this.currentStage = Math.max(0, this.currentStage - 1);
        }
        this.saveProgress();
        
        // Показываем экран восстановления или стартовый экран
        if (this.currentStage > 0 && this.currentStage < this.totalStages) {
            this.showRestoreScreen();
        } else {
            // Если что-то совсем сломалось, перезапускаем
            this.currentStage = 0;
            this.showScreen('startScreen');
        }
    }
}

// Инициализация игры при загрузке страницы
let game;
document.addEventListener('DOMContentLoaded', () => {
    try {
        game = new Game();
    } catch (error) {
        console.error('Критическая ошибка инициализации:', error);
        alert('Ошибка загрузки игры. Пожалуйста, обновите страницу.');
    }
});

// Обработка ошибок на уровне страницы
window.addEventListener('error', (event) => {
    console.error('Глобальная ошибка:', event.error);
    // Не показываем пользователю технические ошибки
});

// Обработка необработанных промисов
window.addEventListener('unhandledrejection', (event) => {
    console.error('Необработанный промис:', event.reason);
    // Предотвращаем сбой игры
    event.preventDefault();
});

