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

# Expose port
EXPOSE 3000

# Start application
CMD ["bun", "run", "start"]