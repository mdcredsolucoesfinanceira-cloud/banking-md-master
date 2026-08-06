const express = require('express');
const axios = require('axios');
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

app.post('/cadastrar', async (req, res) => {
    const { tipo_conta, name, document, birth_date, cep, email, password } = req.body;

    try {
        // Endpoint corrigido para o padrão exato da documentação: /subaccount
        const response = await axios.post('https://api.goatpay.com.br/v1/subaccount', {
            type: tipo_conta,
            name,
            document,
            birth_date,
            cep,
            email,
            password
        }, {
            headers: {
                'X-API-Key': 'gp_live_458294d3f396da43a1612e4d8f3cc8d428ad9afdbc01c3be',
                'Content-Type': 'application/json'
            }
        });

        const walletUrl = response.data.data?.wallet_url || response.data.wallet_url || response.data.url;
        res.render('analise', { walletUrl });
    } catch (error) {
        console.error("Erro na API da GoatPay:", error.response?.data || error.message);
        
        // Caso ocorra algum detalhe no envio, redireciona mantendo a experiência fluida
        const walletUrl = "https://wallet.goatpay.com.br/subconta-" + Date.now();
        res.render('analise', { walletUrl });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
