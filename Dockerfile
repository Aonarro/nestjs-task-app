FROM node:18-alpine

WORKDIR /app

# Копируем package.json и package-lock.json в контейнер
COPY package*.json ./

# Устанавливаем зависимости, используя npm install, если файл package-lock.json был обновлен
RUN npm install

# Копируем все остальные файлы в контейнер
COPY . .

# Строим проект
RUN npm run build

EXPOSE 8080

# Запускаем приложение
CMD ["npm", "run", "start:prod"]
