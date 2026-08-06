const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rota inicial exibe a Splash Screen com a barra de 6 segundos
app.get('/', (req, res) => {
    res.render('splash');
});

// Rota do formulário de cadastro idêntico ao da GoatPay
app.get('/cadastro', (req, res) => {
    res.render('cadastro');
});

app.post('/cadastrar', async (req, res) => {
    const { tipo_conta, name, document, birth_date, cep, email, password } = req.body;

    try {
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
        const walletUrl = "https://wallet.goatpay.com/dashboard-" + Date.now();
        res.render('analise', { walletUrl });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
