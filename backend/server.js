const express = require('express');
const { sequelize } = require('./models');
const userRoutes = require('./routes/userRoutes');
const vistoriaRoutes = require('./routes/vistoriaRoutes');
const authRoutes = require('./routes/authRoutes');
const embarcacaoRoutes = require('./routes/embarcacaoRoutes');
const localRoutes = require('./routes/localRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para processar o corpo de requisições JSON.
app.use(express.json());

// Bloco para testar a conexão ao iniciar o servidor
sequelize.authenticate()
  .then(() => console.log('Conexão com o banco de dados bem-sucedida!'))
  .catch(err => console.error('Não foi possível conectar ao banco de dados:', err));

// Rota principal para verificar se a API está no ar
app.get('/', (req, res) => {
  res.send('API do SGVN está funcionando!');
});

// "Plug-in" das rotas na aplicação principal
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/vistorias', vistoriaRoutes);
app.use('/api/embarcacoes', embarcacaoRoutes);
app.use('/api/locais', localRoutes); 

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});