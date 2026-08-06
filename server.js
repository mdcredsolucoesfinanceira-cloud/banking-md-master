const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal direciona para o cadastro
app.get('/', (req, res) => {
    res.render('cadastro');
});

// Rota que envia os dados automaticamente para a GoatPay
app.post('/cadastrar', async (req, res) => {
    const { name, email, document } = req.body;

    try {
        // Substitua abaixo com o endpoint real e o token/chave da API da GoatPay se necessário
        const response = await axios.post('https://api.goatpay.com/v1/subaccounts', {
            name,
            email,
            document
        }, {
            headers: {
                'Authorization': 'Bearer SEU_TOKEN_GOATPAY_AQUI',
                'Content-Type': 'application/json'
            }
        });

        // Captura o Wallet URL retornado pela API da GoatPay (ajuste o campo conforme a documentação deles)
        const walletUrl = response.data.wallet_url || response.data.url || "https://painel.goatpay.com/wallet/exemplo";

        res.render('analise', { walletUrl });
    } catch (error) {
        console.error("Erro na integração GoatPay:", error.response?.data || error.message);
        
        // Mesmo se houver falha de rede/API temporária, simulamos para teste ou passamos a URL de fallback
        const walletUrl = "https://painel.goatpay.com/wallet/pendente";
        res.render('analise', { walletUrl });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor limpo rodando na porta ${PORT}`);
});
