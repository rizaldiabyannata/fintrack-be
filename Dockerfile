# Tahap 1: Builder - Menginstall dependensi dan membangun aplikasi
FROM node:18-alpine AS builder

# Set direktori kerja di dalam kontainer
WORKDIR /app

# Salin package.json dan package-lock.json untuk memanfaatkan cache Docker
COPY package.json package-lock.json ./

# Install hanya dependensi produksi untuk menjaga ukuran image tetap kecil
RUN npm ci --only=production

# Salin sisa kode aplikasi
COPY . .

# --------------------------------------------------------------------

# Tahap 2: Final Image - Menjalankan aplikasi
FROM node:18-alpine

WORKDIR /app

# Salin node_modules dan kode aplikasi dari tahap builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Aplikasi berjalan di port 4000 secara default
EXPOSE 3000

# Perintah untuk menjalankan aplikasi
CMD ["node", "index.js"]