# PWA Icons

Эта папка должна содержать иконки для PWA в формате PNG.

## Требуемые размеры

- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`

## Быстрое создание placeholder иконок

### Вариант 1: Онлайн-генератор (Рекомендуется)

1. Перейти на https://realfavicongenerator.net/
2. Загрузить базовое изображение 512x512px
3. Сгенерировать и скачать все иконки
4. Скопировать PNG файлы в эту папку

### Вариант 2: ImageMagick (для тестирования)

```bash
# Зеленые квадраты (цвет приложения #4CAF50)
convert -size 72x72 xc:#4CAF50 icon-72x72.png
convert -size 96x96 xc:#4CAF50 icon-96x96.png
convert -size 128x128 xc:#4CAF50 icon-128x128.png
convert -size 144x144 xc:#4CAF50 icon-144x144.png
convert -size 152x152 xc:#4CAF50 icon-152x152.png
convert -size 192x192 xc:#4CAF50 icon-192x192.png
convert -size 384x384 xc:#4CAF50 icon-384x384.png
convert -size 512x512 xc:#4CAF50 icon-512x512.png
```

### Вариант 3: Paint/Photoshop

1. Создайте квадратное изображение 512x512px
2. Заполните цветом #4CAF50 (зеленый)
3. Добавьте белый emoji 💚 или текст "PA" по центру
4. Сохраните как PNG
5. Используйте онлайн-ресайзер для создания остальных размеров

## Для production

Рекомендуется создать профессиональные иконки с:
- Логотипом приложения
- Адаптивным дизайном для разных размеров
- Safe area для iOS (избегайте важных элементов по краям)
- Контрастными цветами для видимости
