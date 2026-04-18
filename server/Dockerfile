FROM node:20-slim

# Install curl for Ollama installer
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl -fsSL https://ollama.ai/install.sh | sh

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

# Start Ollama, pull model, then start server
CMD sh -c "ollama serve & sleep 8 && ollama pull ${LLM_MODEL:-mistral} && node index.js"
