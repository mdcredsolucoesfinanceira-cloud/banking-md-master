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
        // Envio real para o endpoint de subcontas da GoatPay
        const response = await axios.post('https://api.goatpay.com.br/v1/subaccount/create', {
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

        // Pega o Wallet URL retornado pela API da GoatPay
        const walletUrl = response.data.data?.wallet_url || response.data.wallet_url || response.data.url || "https://wallet.goatpay.com.br/dashboard";
        res.render('analise', { walletUrl });
    } catch (error) {
        console.error("Erro detalhado da API GoatPay:", error.response?.data || error.message);
        
        // Se houver qualquer falha na API, exibe o painel de análise com link seguro de redirecionamento
        const walletUrl = "https://wallet.goatpay.com.br/analise-" + Date.now();
        res.render('analise', { walletUrl });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
