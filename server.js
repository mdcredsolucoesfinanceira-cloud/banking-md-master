const express = require('express');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Função segura para renderizar as páginas sem derrubar o servidor se faltar algo
const renderSafe = (viewName) => (req, res) => {
  try {
    res.render(viewName);
  } catch (err) {
    res.status(500).send(`Erro ao carregar a página ${viewName}: ${err.message}`);
  }
};

app.get('/', renderSafe('index'));
app.get('/login', renderSafe('login'));
app.get('/cadastro', renderSafe('cadastro'));
app.get('/extrato', renderSafe('extrato'));
app.get('/analise', renderSafe('analise'));
app.get('/pix-enviar', renderSafe('pix-enviar'));
app.get('/pix-receber', renderSafe('pix-receber'));
app.get('/splash', renderSafe('splash'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
