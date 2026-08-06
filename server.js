const express = require('express');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  try {
    res.render('index');
  } catch (err) {
    res.status(500).send("ERRO DETALHADO: " + err.stack);
  }
});

app.get('/login', (req, res) => res.render('login'));
app.get('/cadastro', (req, res) => res.render('cadastro'));
app.get('/extrato', (req, res) => res.render('extrato'));
app.get('/analise', (req, res) => res.render('analise'));
app.get('/pix-enviar', (req, res) => res.render('pix-enviar'));
app.get('/pix-receber', (req, res) => res.render('pix-receber'));
app.get('/splash', (req, res) => res.render('splash'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
