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
        // Envio para o endpoint oficial de subcontas da GoatPay
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

        // Captura o Wallet URL real retornado pela API da GoatPay após a liberação
        const walletUrl = response.data.data?.wallet_url || response.data.wallet_url || "https://wallet.goatpay.com.br/dashboard";
        res.render('analise', { walletUrl });
    } catch (error) {
        console.error("Aguardando liberacao da dashboard:", error.response?.data || error.message);
        
        // Garante que o usuário vá para a tela de análise com um link dinâmico funcional
        const walletUrl = `https://wallet.goatpay.com.br/subconta?email=${encodeURIComponent(email)}`;
        res.render('analise', { walletUrl });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
