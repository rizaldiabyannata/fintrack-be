# Menggunakan image Node.js sebagai base image
FROM oven/bun:latest

# Menentukan direktori kerja di dalam container
WORKDIR /usr/src/app

# Menyalin file package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN bun install

# Buat direktori untuk firebase jika belum ada
RUN mkdir -p shared/firebase

# Menyalin sisa kode aplikasi
COPY . .

# Set permissions jika diperlukan
RUN chmod -R 755 shared/

# Menentukan port yang akan digunakan oleh aplikasi
EXPOSE 3000

# Menjalankan aplikasi saat container dimulai
CMD ["bun", "run", "dev"]