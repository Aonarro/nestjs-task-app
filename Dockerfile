# Используем официальный образ Node.js 22 (или 18, если 22 не нужен)
FROM node:22

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json в контейнер
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальные файлы в контейнер
COPY . .

# Собираем проект
RUN npm run build

# Открываем порт, на котором будет работать приложение
EXPOSE 8080

# Запускаем приложение
CMD ["npm", "run", "start:prod"]
