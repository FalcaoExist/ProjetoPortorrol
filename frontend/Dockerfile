# Usando Node 18
FROM node:20

# Diretório de trabalho dentro do container
WORKDIR /app

# Copiar package.json e package-lock.json para instalar dependências primeiro
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o restante do código
COPY . .

# Expor a porta que será usada pelo Vite
EXPOSE 5173

# Comando para rodar o Vite no host 0.0.0.0, garantindo acesso externo ao container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

