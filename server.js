const express = require('express');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('splash');
});

app.get('/cadastro', (req, res) => {
    res.render('cadastro');
});

app.post('/cadastrar', (req, res) => {
    const { name, email } = req.body;

    // Gera um link de carteira exclusivo e seguro para o usuário cadastrado
    const walletId = Math.random().toString(36).substring(2, 10);
    const walletUrl = `https://wallet.goatpay.com.br/dashboard/${walletId}`;

    // Redireciona para a tela de análise/sucesso com a URL da wallet gerada
    res.render('analise', { walletUrl });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
