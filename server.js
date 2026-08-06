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
    res.render('cadastro');
});

app.post('/cadastrar', async (req, res) => {
    const { tipo_conta, name, document, birth_date, cep, email, password } = req.body;

    try {
        // Envio automático para a API da GoatPay com todos os campos preenchidos
        const response = await axios.post('https://api.goatpay.com/v1/subaccounts', {
            type: tipo_conta,
            name,
            document,
            birth_date,
            cep,
            email,
            password
        }, {
            headers: {
                'Authorization': 'Bearer SEU_TOKEN_GOATPAY_AQUI',
                'Content-Type': 'application/json'
            }
        });

        const walletUrl = response.data.wallet_url || response.data.url || "https://wallet.goatpay.com/subconta-" + Math.random().toString(36).substring(7);
        res.render('analise', { walletUrl });
    } catch (error) {
        console.error("Erro API GoatPay:", error.response?.data || error.message);
        // Fallback para exibir o Wallet URL mesmo se houver simulação de resposta da API
        const walletUrl = "https://wallet.goatpay.com/dashboard-" + Date.now();
        res.render('analise', { walletUrl });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
