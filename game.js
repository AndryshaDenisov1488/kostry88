// Основная логика игры

class Game {
    constructor() {
        this.currentStage = 0;
        this.totalStages = GAME_CONFIG.totalStages;
        this.isMusicPlaying = false;
        this.isMusicEnabled = false;
        this.progressKey = 'footballQuest30_progress';
        
        // Список музыкальных треков для проигрывания по очереди
        this.musicTracks = [
            './assets/audio/holigan.mp3',
            './assets/audio/medlyak.mp3'
        ];
        this.currentTrackIndex = 0;
        
        this.init();
    }
    
    init() {
        this.setupElements();
        this.setupEventListeners();
        this.loadProgress();
        this.setupAudio();
        this.initMap();
        
        // Обработчик изменения размера окна
        this.setupResizeHandler();
        
        // Таймер для подсказок
        this.hintTimer = null;
        
        // Показать стартовый экран или экран восстановления
        if (this.currentStage > 0 && this.currentStage < this.totalStages) {
            this.showRestoreScreen();
        } else {
            this.showScreen('startScreen');
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
                    this.updateMap();
                }
            }, 300);
        });
    }
    
    setupElements() {
        // Экраны
        this.startScreen = document.getElementById('startScreen');
        this.mapScreen = document.getElementById('mapScreen');
        this.taskScreen = document.getElementById('taskScreen');
        this.restoreScreen = document.getElementById('restoreScreen');
        this.finalScreen = document.getElementById('finalScreen');
        
        // Кнопки
        this.startBtn = document.getElementById('startBtn');
        this.musicToggleBtn = document.getElementById('musicToggleBtn');
        this.musicToggleBtnMap = document.getElementById('musicToggleBtnMap');
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
        if (this.musicToggleBtn) {
            this.musicToggleBtn.addEventListener('click', () => this.toggleMusic());
        }
        if (this.musicToggleBtnMap) {
            this.musicToggleBtnMap.addEventListener('click', () => this.toggleMusic());
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
        
        // Увеличенная задержка для гарантии, что карта отрисовалась и камера центрирована
        setTimeout(() => {
            // Дополнительная проверка и центрирование камеры
            const points = this.calculateMapPoints();
            if (points && points.length > 0) {
                const firstPoint = points[0];
                if (firstPoint) {
                    this.moveCamera(firstPoint, true);
                }
            }
            
            // После отрисовки карты показываем задание
            setTimeout(() => {
                this.showScreen('taskScreen');
                this.startStage();
            }, 300);
        }, 800);
    }
    
    restoreGame() {
        this.showScreen('mapScreen');
        
        // Обновляем карту и ждём, пока она полностью загрузится
        this.updateMap();
        
        // Увеличенная задержка для гарантии, что карта отрисовалась и камера центрирована
        setTimeout(() => {
            // Дополнительная проверка и центрирование камеры на текущей точке
            const points = this.calculateMapPoints();
            if (points && points.length > 0) {
                const currentPoint = points[this.currentStage] || points[0];
                if (currentPoint) {
                    this.moveCamera(currentPoint, true);
                }
            }
            
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
        
        // Задержка для того, чтобы карта успела получить размеры
        // Используем больше времени для гарантии правильной отрисовки
        setTimeout(() => {
            // Очистить карту
            this.map.innerHTML = '';
            
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
            
            // Нарисовать путь
            this.drawPath(points);
            
            // Добавляем бетонные плиты в начале дорожки (первый этап)
            if (this.currentStage === 0 || this.currentStage === 1) {
                this.createStartingPlates(points[0]);
            }
            
            // Добавляем правые ворота (если их еще нет)
            if (!this.map.querySelector('.goal-right')) {
                const goalRight = document.createElement('div');
                goalRight.className = 'goal-right';
                this.map.appendChild(goalRight);
            }
            
            // Нарисовать точки
            points.forEach((point, index) => {
                const pointElement = this.createMapPoint(point, index);
                if (pointElement && this.map) {
                    this.map.appendChild(pointElement);
                }
            });
            
            // Позиционировать персонажа на текущей точке (без анимации)
            const targetPoint = points[this.currentStage] || points[0];
            if (targetPoint && this.character) {
                // Временно убираем transition для мгновенного позиционирования
                const oldTransition = this.character.style.transition;
                this.character.style.transition = 'none';
                this.positionCharacter(targetPoint);
                
                // Немедленно центрируем камеру на текущей точке БЕЗ анимации
                // Используем несколько вызовов для гарантии правильной отрисовки
                const centerCamera = () => {
                    this.moveCamera(targetPoint, true); // instant = true
                    
                    // Проверяем, что камера действительно центрирована
                    setTimeout(() => {
                        const mapContainer = document.querySelector('.map-container');
                        if (mapContainer) {
                            const computedStyle = window.getComputedStyle(mapContainer);
                            const transform = computedStyle.transform;
                            // Если transform не применился, пробуем ещё раз
                            if (!transform || transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)') {
                                this.moveCamera(targetPoint, true);
                            }
                        }
                        
                        // Восстанавливаем transition
                        if (this.character) {
                            this.character.style.transition = oldTransition || '';
                        }
                    }, 200);
                };
                
                // Двойной requestAnimationFrame для гарантии отрисовки
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        centerCamera();
                    });
                });
            } else if (points[0] && this.character) {
                // Если текущая точка не найдена, используем первую
                const oldTransition = this.character.style.transition;
                this.character.style.transition = 'none';
                this.positionCharacter(points[0]);
                
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        this.moveCamera(points[0], true);
                        
                        setTimeout(() => {
                            if (this.character) {
                                this.character.style.transition = oldTransition || '';
                            }
                        }, 200);
                    });
                });
            }
            
            // Обновить прогресс
            this.updateProgress();
            
            // Дополнительная проверка и центрирование через небольшую задержку
            setTimeout(() => {
                const currentPoint = points[this.currentStage] || points[0];
                if (currentPoint) {
                    // Проверяем, что камера действительно центрирована
                    const mapContainer = document.querySelector('.map-container');
                    if (mapContainer) {
                        const style = window.getComputedStyle(mapContainer);
                        const transform = style.transform;
                        // Если камера не смещена, центрируем её
                        if (!transform || transform === 'none' || transform.includes('0, 0, 0')) {
                            this.moveCamera(currentPoint, true);
                        }
                    }
                }
            }, 100);
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
    calculatePointsWithSize(mapWidth, mapHeight) {
        const points = [];
        
        // Адаптивный padding в зависимости от размера экрана (минимальный для полного экрана)
        const isMobile = mapWidth <= 768;
        const paddingX = isMobile ? 30 : 50;
        const paddingY = isMobile ? 40 : 60;
        
        // Доступная область для размещения точек (в пределах экрана, используем весь доступный размер)
        const availableWidth = Math.max(200, mapWidth - paddingX * 2);
        const availableHeight = Math.max(200, mapHeight - paddingY * 2);
        
        // Создаём путь в виде зигзага/серпантина
        // На мобильных делаем более компактный путь (3 колонки), на десктопах - 5
        const columns = isMobile ? 3 : 5;
        const rows = Math.ceil(this.totalStages / columns);
        const segmentWidth = columns > 1 ? availableWidth / (columns - 1) : availableWidth;
        const segmentHeight = rows > 1 ? availableHeight / (rows - 1) : availableHeight;
        
        // Начинаем с центра доступной области для видимости при старте
        const startX = paddingX + availableWidth / 2;
        const startY = paddingY + availableHeight / 2;
        let x = startX;
        let y = startY;
        let currentColumn = 0;
        
        // Первая точка в центре для лучшей видимости
        if (this.totalStages > 0) {
            const z = Math.sin(0 * 0.3) * 30;
            points.push({ x, y, z, index: 0 });
        }
        
        // Распределяем остальные точки по маршруту от центра
        // Используем зигзаг от центра в пределах доступной области
        for (let i = 1; i < this.totalStages; i++) {
            const z = Math.sin(i * 0.3) * 30;
            
            currentColumn++;
            
            // Если достигли конца строки, переходим на следующую
            if (currentColumn >= columns) {
                currentColumn = 0;
                y = paddingY + ((Math.floor(i / columns) + 1) * segmentHeight);
                // Новая строка начинается от центра
                x = startX;
            } else {
                // Двигаемся в текущей строке от центра
                // Вычисляем смещение от центра (может быть отрицательным)
                const columnOffset = currentColumn - Math.floor(columns / 2);
                const offsetFromCenter = columnOffset * segmentWidth;
                x = startX + offsetFromCenter;
            }
            
            // Ограничиваем точки в пределах экрана (с запасом для элементов)
            const margin = 30;
            x = Math.max(paddingX + margin, Math.min(mapWidth - paddingX - margin, x));
            y = Math.max(paddingY + margin, Math.min(mapHeight - paddingY - margin, y));
            
            points.push({ x, y, z, index: i });
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
    
    createMapPoint(point, index) {
        const pointElement = document.createElement('div');
        pointElement.className = 'map-point';
        
        // Адаптивный размер точки
        const isMobile = window.innerWidth <= 768;
        const pointSize = isMobile ? 12.5 : 15;
        
        pointElement.style.left = (point.x - pointSize) + 'px';
        pointElement.style.top = (point.y - pointSize) + 'px';
        pointElement.textContent = index + 1;
        
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
            
            // Движение камеры - следуем за персонажем
            this.moveCamera(toPoint);
            
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
        
        // Если instant = true, перемещаем мгновенно (без анимации)
        if (instant) {
            mapContainer.style.transition = 'none';
        } else {
            mapContainer.style.transition = 'transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }
        
        mapContainer.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
        mapContainer.style.webkitTransform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
        
        // Восстанавливаем transition после мгновенного перемещения
        if (instant) {
            setTimeout(() => {
                if (mapContainer) {
                    mapContainer.style.transition = 'transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                }
            }, 100);
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
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                img.onerror = () => this.handleImageError(img);
                img.onload = () => this.hideLoader();
                this.showLoader();
                this.modalBody.appendChild(img);
            } else if (content.type === 'video' && content.videoPath) {
                const video = document.createElement('video');
                video.src = content.videoPath;
                video.controls = true;
                video.preload = 'metadata';
                video.style.maxWidth = '100%';
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
                textContent.style.fontSize = '1.3rem';
                textContent.style.textAlign = 'center';
                textContent.style.padding = '20px';
                textContent.style.background = '#f0f0f0';
                textContent.style.borderRadius = '10px';
                textContent.style.lineHeight = '1.8';
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
        const points = this.calculateMapPoints();
        if (!points || points.length === 0) return;
        
        const nextPoint = points[this.currentStage + 1];
        if (!nextPoint) return;
        
        // Находим элемент точки на карте
        const mapPoints = this.map.querySelectorAll('.map-point');
        const nextPointElement = mapPoints[this.currentStage + 1];
        
        if (nextPointElement) {
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
            
            // Позиционируем подсказку рядом с точкой
            const rect = nextPointElement.getBoundingClientRect();
            const mapRect = this.map.getBoundingClientRect();
            
            hintElement.style.left = (nextPoint.x + 40) + 'px';
            hintElement.style.top = (nextPoint.y - 20) + 'px';
            
            this.map.appendChild(hintElement);
            
            // Анимация появления
            setTimeout(() => {
                hintElement.classList.add('visible');
            }, 50);
        }
    }
    
    hideHint() {
        const hintElement = document.getElementById('hintPopup');
        if (hintElement) {
            hintElement.classList.remove('visible');
            setTimeout(() => {
                hintElement.remove();
            }, 300);
        }
        
        // Убираем подсветку с точек
        const highlighted = this.map.querySelectorAll('.map-point.hint-highlight');
        highlighted.forEach(point => {
            point.classList.remove('hint-highlight');
        });
    }
    
    // Клик по точке на карте (интерактивное управление)
    goToStage(targetStage) {
        // Можно идти только на следующий этап
        if (targetStage !== this.currentStage + 1 || targetStage >= this.totalStages) {
            return;
        }
        
        // Останавливаем подсказку
        this.stopHintTimer();
        
        // Проверяем на финальный этап
        if (targetStage >= this.totalStages) {
            this.showFinalScreen();
            return;
        }
        
        // Обновляем текущий этап
        this.currentStage = targetStage;
        this.saveProgress();
        
        // Получаем точки для перемещения персонажа
        const points = this.calculateMapPoints();
        if (!points || points.length === 0) {
            this.showScreen('taskScreen');
            this.startStage();
            return;
        }
        
        const previousPoint = points[this.currentStage - 1];
        const currentPoint = points[this.currentStage];
        
        // Показываем карту для движения персонажа
        this.showScreen('mapScreen');
        this.updateMap();
        
        if (currentPoint) {
            // Перемещаем персонажа от предыдущей точки к текущей
            if (previousPoint) {
                this.positionCharacter(previousPoint);
            }
            
            setTimeout(() => {
                this.moveCharacter(currentPoint).then(() => {
                    // После движения показываем задание
                    setTimeout(() => {
                        this.showScreen('taskScreen');
                        this.startStage();
                    }, 300);
                });
            }, 200);
        } else {
            this.showScreen('taskScreen');
            this.startStage();
        }
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
            // Первый раз включаем музыку
            this.isMusicEnabled = true;
            
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

