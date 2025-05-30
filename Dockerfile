# Menggunakan image Bun sebagai base image
FROM oven/bun:latest

# Menentukan direktori kerja di dalam container
WORKDIR /usr/src/app

# Copy package.json first untuk better caching
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Buat direktori untuk firebase jika belum ada
RUN mkdir -p shared/firebase

# Copy source code
COPY . .

# Set permissions
RUN chmod -R 755 shared/ || true

# Create non-root user untuk security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 bun

# Change ownership
RUN chown -R bun:nodejs /usr/src/app

USER bun

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["bun", "run", "start"]