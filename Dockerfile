FROM nginx:alpine

# Метаданные
LABEL maintainer="PulseApp"
LABEL description="PulseApp Frontend - PWA для ежедневных комплиментов"
LABEL version="1.0"

# Копируем кастомную конфигурацию Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Удаляем дефолтный контент Nginx
RUN rm -rf /usr/share/nginx/html/*

# Копируем статические файлы PWA
COPY index.html /usr/share/nginx/html/
COPY config.js /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY manifest.json /usr/share/nginx/html/
COPY service-worker.js /usr/share/nginx/html/
COPY icons/ /usr/share/nginx/html/icons/

# Устанавливаем правильные права доступа
RUN chmod -R 755 /usr/share/nginx/html

# Nginx запускается на порту 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Запускаем Nginx в foreground режиме
CMD ["nginx", "-g", "daemon off;"]
