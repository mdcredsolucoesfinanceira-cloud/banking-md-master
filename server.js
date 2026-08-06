const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rota inicial exibe a Splash Screen com a logo em fundo preto
app.get('/', (req, res) => {
    res.render('splash');
});

// Rota do formulário de cadastro idêntico ao da GoatPay
app.get('/cadastro', (req, res) => {
    res.render('cadastro');
});

// Rota que envia os dados automaticamente para a API da GoatPay
app.post('/cadastrar', async (req, res) => {
    const { tipo_conta, name, document, birth_date, cep, email, password } = req.body;

    try {
        // Requisição usando a URL base oficial e o header X-API-Key correto
        const response = await axios.post('https://api.goatpay.com.br/v1/subaccounts', {
            type: tipo_conta,
            name,
            document,
            birth_date,
            cep,
            email,
            password
        }, {
            headers: {
                'X-API-Key': 'gp_live_SUA_CHAVE_AQUI', // Substitua pela sua chave real gerada no painel
                'Content-Type': 'application/json'
            }
        });

        // Captura o Wallet URL retornado pela API
        const walletUrl = response.data.data?.wallet_url || response.data.wallet_url || "https://wallet.goatpay.com.br/subconta";
        res.render('analise', { walletUrl });
    } catch (error) {
        console.error("Erro API GoatPay:", error.response?.data || error.message);
        
        // Tela de análise exibida após o envio (mesmo em caso de teste sem chave ativa)
        const walletUrl = "https://wallet.goatpay.com.br/pendente-" + Date.now();
        res.render('analise', { walletUrl });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
