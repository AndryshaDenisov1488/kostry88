# 🔍 Поиск и создание папки для kostry88.ru

## Шаг 1: Найти где находятся другие проекты

```bash
# Посмотреть структуру /home
ls -la /home/

# Посмотреть есть ли папки domains
ls -la /home/*/domains/ 2>/dev/null

# Или проверить /var/www
ls -la /var/www/ 2>/dev/null

# Найти все папки public_html
find /home -name "public_html" -type d 2>/dev/null
find /var/www -name "public_html" -type d 2>/dev/null
```

---

## Шаг 2: Посмотреть структуру существующих проектов

```bash
# Посмотреть какие домены уже есть
ls -la /home/*/domains/ 2>/dev/null | head -20

# Или
ls -la /var/www/ 2>/dev/null | head -20
```

---

## Шаг 3: Создать папку для kostry88.ru

### Вариант A: Если структура /home/username/domains/

```bash
# Найти имя пользователя (обычно это владелец других доменов)
ls -la /home/

# Создать структуру (замените username на реальное имя)
mkdir -p /home/username/domains/kostry88.ru/public_html

# Установить права
chown -R username:www-data /home/username/domains/kostry88.ru/
chmod -R 755 /home/username/domains/kostry88.ru/
```

### Вариант B: Если структура /var/www/

```bash
# Создать структуру
mkdir -p /var/www/kostry88.ru/public_html

# Установить права
chown -R www-data:www-data /var/www/kostry88.ru/
chmod -R 755 /var/www/kostry88.ru/
```

---

## Шаг 4: Клонировать проект в созданную папку

```bash
# Перейти в папку
cd /путь/к/kostry88.ru/public_html

# Клонировать репозиторий
git clone https://github.com/AndryshaDenisov1488/kostry88.git .

# Или если папка не пустая
rm -rf * .[^.]* 2>/dev/null
git clone https://github.com/AndryshaDenisov1488/kostry88.git .
```

---

## Шаг 5: Настроить домен в панели Beget

1. Зайдите в панель управления Beget
2. Найдите "Домены" или "Domains"
3. Добавьте домен `kostry88.ru`
4. Укажите путь: `/путь/к/kostry88.ru/public_html`
5. Сохраните

---

## Быстрая команда для поиска структуры

```bash
# Найти все папки с доменами
find /home -type d -name "*.ru" 2>/dev/null | head -10
find /var/www -type d -name "*.ru" 2>/dev/null | head -10

# Посмотреть владельца существующих папок
ls -la /home/*/domains/ 2>/dev/null
```

---

## Если не знаете структуру - используйте стандартную

```bash
# Создать в стандартном месте
mkdir -p /var/www/kostry88.ru/public_html
chown -R www-data:www-data /var/www/kostry88.ru/
chmod -R 755 /var/www/kostry88.ru/

# Клонировать проект
cd /var/www/kostry88.ru/public_html
git clone https://github.com/AndryshaDenisov1488/kostry88.git .
```

