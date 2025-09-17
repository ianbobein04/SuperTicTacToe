FROM node:20-slim
WORKDIR /app
COPY package.json ./
RUN npm i -g pnpm && pnpm install
COPY . .
EXPOSE 5173
CMD ["pnpm", "dev", "--host"]
