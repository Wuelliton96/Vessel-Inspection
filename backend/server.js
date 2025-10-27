// Carrega variáveis de ambiente ANTES de qualquer outro require
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Se seu models/index.js exporta { sequelize, ... }
const { sequelize } = require('./models');

// Rotas
const userRoutes = require('./routes/userRoutes');
const vistoriaRoutes = require('./routes/vistoriaRoutes');
const authRoutes = require('./routes/authRoutes');
const embarcacaoRoutes = require('./routes/embarcacaoRoutes');
const localRoutes = require('./routes/localRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
  credentials: true
}));

// Middleware para JSON
app.use(express.json());

// Teste de conexão ao iniciar o servidor
sequelize.authenticate()
  .then(() => console.log('Conexão com o banco de dados bem-sucedida!'))
  .catch(err => console.error('Não foi possível conectar ao banco de dados:', err));

// Rota de health-check
app.get('/', (req, res) => {
  res.send('API do SGVN está funcionando!');
});

// Middleware para log de todas as requisições
app.use((req, res, next) => {
  console.log(`\n=== NOVA REQUISIÇÃO ===`);
  console.log(`${req.method} ${req.path}`);
  console.log(`Headers:`, req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`Body:`, req.body);
  }
  console.log(`=== FIM DA REQUISIÇÃO ===\n`);
  next();
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/vistorias', vistoriaRoutes);
app.use('/api/embarcacoes', embarcacaoRoutes);
app.use('/api/locais', localRoutes);

// Sobe o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});