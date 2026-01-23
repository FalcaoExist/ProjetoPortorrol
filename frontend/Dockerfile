# Usando Node 18
FROM node:20

# Diretório de trabalho dentro do container
WORKDIR /app

# Copiar package.json e package-lock.json para instalar dependências primeiro
COPY package*.json ./

FROM node:20

WORKDIR /app

# Copia SOMENTE os manifests do frontend
COPY frontend/package*.json ./

# Instala as dependências do frontend (xlsx incluído)
RUN npm install

# Agora sim copia o código do frontend
COPY frontend/ .

# Porta do Vite
EXPOSE 5173

# Rodar o Vite acessível externamente
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]


