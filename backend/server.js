require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const userRoutes = require('./routes/userRoutes');
const vistoriaRoutes = require('./routes/vistoriaRoutes');
const authRoutes = require('./routes/authRoutes');
const embarcacaoRoutes = require('./routes/embarcacaoRoutes');
const localRoutes = require('./routes/localRoutes');
const fotoRoutes = require('./routes/fotoRoutes');
const tipoFotoChecklistRoutes = require('./routes/tipoFotoChecklistRoutes');
const vistoriadorRoutes = require('./routes/vistoriadorRoutes');
const pagamentoRoutes = require('./routes/pagamentoRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const seguradoraRoutes = require('./routes/seguradoraRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const checklistRoutes = require('./routes/checklistRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

sequelize.authenticate()
  .then(() => console.log('Conexão com o banco de dados bem-sucedida!'))
  .catch(err => console.error('Não foi possível conectar ao banco de dados:', err));

app.get('/', (req, res) => {
  res.send('API do SGVN está funcionando!');
});

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/vistorias', vistoriaRoutes);
app.use('/api/embarcacoes', embarcacaoRoutes);
app.use('/api/locais', localRoutes);
app.use('/api/fotos', fotoRoutes);
app.use('/api/tipos-foto-checklist', tipoFotoChecklistRoutes);
app.use('/api/vistoriador', vistoriadorRoutes);
app.use('/api/pagamentos', pagamentoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/seguradoras', seguradoraRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/checklists', checklistRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});