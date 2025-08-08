import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import router from "./Rutas/rutas";
import dotenv from "dotenv";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import Certificado from "./Models/Certificado";
import { CAService } from "./Services/CAService";
import { testEmailConfig } from "./Controllers/usercontroller";
import { sequelize, testPostgresConnection } from "./config/database";
import Usuario from "./Models/UsuarioPostgres";
import WebSocketService from "./Services/WebSocketService";
import { auth } from "./Middleware/authMiddleware";

// Cargar variables de entorno
dotenv.config();

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(morgan("dev"));
const Puerto = process.env.PORT ? parseInt(process.env.PORT) : 3002;

// Configurar CORS para permitir credenciales
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Range'],
  exposedHeaders: ['Content-Length', 'Content-Range', 'Content-Type']
}));

// Configurar express para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Conexión a PostgreSQL para usuarios
await testPostgresConnection();
await sequelize.sync({ alter: true }); // Sincronizar tablas
console.log('✅ Tabla de usuarios sincronizada en PostgreSQL');

// Conexión a MongoDB
await mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/Documentos", {
    authSource: "admin",
    user: process.env.MONGODB_USER || "root",
    pass: process.env.MONGODB_PASS || "admin",
    dbName: process.env.MONGODB_DB || "Documentos",
  })
  .then(async () => {
    console.log("✅ Conectado a MongoDB (Documentos)");
    // Limpiar índices problemáticos de certificados
    try {
      await (Certificado as any).fixIndexes();
      console.log("✅ Índices de certificados corregidos");
    } catch (error) {
      console.log("⚠️ Error al corregir índices:", error);
    }
    
    // Inicializar sistema CA
    try {
      await CAService.initializeCA();
    } catch (error) {
      console.log("⚠️ Error inicializando sistema CA:", error);
    }

    // Verificar configuración de email
    try {
      await testEmailConfig();
    } catch (error) {
      console.log("⚠️ Error verificando configuración de email:", error);
    }
  })
  .catch((err) => {
    console.log("⚠️ Error de conexión a MongoDB:", err);
    console.log("ℹ️ Verifica que MongoDB esté corriendo y las credenciales sean correctas");
  });

app.use("/api/", router);

// Endpoint de prueba simple
app.get('/', (req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// Endpoint de prueba para verificar que el servidor está funcionando
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// Endpoint de prueba para verificar autenticación
app.get('/test-auth', auth, (req, res) => {
  res.json({ 
    message: 'Authentication working', 
    user: req.user,
    timestamp: new Date().toISOString() 
  });
});

// Endpoint de prueba para preview
app.get('/test-preview/:id', (req, res) => {
  const { id } = req.params;
  const authHeader = req.header('Authorization');
  
  res.json({ 
    message: 'Preview test endpoint',
    id: id,
    hasAuthHeader: !!authHeader,
    authHeader: authHeader ? authHeader.substring(0, 50) + '...' : 'none',
    timestamp: new Date().toISOString()
  });
});

// Crear servidor HTTP para WebSocket
const server = createServer(app);

// Inicializar WebSocket
WebSocketService.initialize(server);

server.listen(Puerto, () => {
  console.log(`Servidor corriendo en el puerto ${Puerto}`);
  console.log(`WebSocket disponible en ws://localhost:${Puerto}`);
  console.log(`Test endpoint: http://localhost:${Puerto}/test`);
  console.log(`Preview test endpoint: http://localhost:${Puerto}/test-preview/123`);
});
