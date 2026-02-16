FROM node:22-bookworm-slim

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml tsconfig.json ./
RUN pnpm install --frozen-lockfile

COPY src ./src

RUN pnpm build && pnpm prune --prod

ENV MCP_TRANSPORT=http
ENV MCP_HOST=0.0.0.0
ENV MCP_PORT=8787

EXPOSE 8787

CMD ["node", "build/index.js", "--transport", "http", "--host", "0.0.0.0", "--port", "8787"]
