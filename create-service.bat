@echo off
set /p SERVICE_NAME=Masukkan nama service:

mkdir %SERVICE_NAME%
cd %SERVICE_NAME%

mkdir controllers models routes config
echo {} > package.json

echo Installing dependencies for %SERVICE_NAME%...
npm init -y
npm install express mongoose dotenv jsonwebtoken amqplib

echo Creating starter files...
echo const express = require("express"); > app.js
echo const dotenv = require("dotenv"); >> app.js
echo dotenv.config(); >> app.js
echo const app = express(); >> app.js
echo app.use(express.json()); >> app.js
echo app.listen(5000, () => console.log("%SERVICE_NAME% running")); >> app.js

cd ..
echo Selesai membuat service: %SERVICE_NAME%
