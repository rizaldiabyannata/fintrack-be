# Menggunakan image Node.js sebagai base image
FROM node:latest

# Menentukan direktori kerja di dalam container
WORKDIR /usr/src/app

# Menyalin file package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Menyalin sisa kode aplikasi
COPY . .

# Menentukan port yang akan digunakan oleh aplikasi
EXPOSE 3000

# Menjalankan aplikasi saat container dimulai
CMD ["node", "index.js"]
