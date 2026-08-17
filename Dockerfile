# Pinned to the exact @playwright/test version in package.json — the image ships browser
# binaries that must match the npm package version exactly, or tests fail to launch.
FROM mcr.microsoft.com/playwright:v1.62.1-noble

WORKDIR /app

# Corepack ships with Node but isn't enabled by default in this image.
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

CMD ["pnpm", "test"]
