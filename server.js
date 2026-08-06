const express = require('express');
const axios = require('axios');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();

// --- BLINDAGEM E SEGURANÇA ---
app.use(helmet({
    contentSecurityPolicy: false, // Mantém compatibilidade com scripts e fontes das views
}));
app.use(cors());

// Limiter para evitar ataques de força bruta e spam no cadastro (máximo 10 requisições por 15 minutos por IP)
const cadastroLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Muitas tentativas a partir deste IP. Tente novamente mais tarde."
});
// -----------------------------

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

// Rota de cadastro blindada com o limitador de requisições
app.post('/cadastrar', cadastroLimiter, async (req, res) => {
    const { tipo_conta, name, document, birth_date, cep, email, password } = req.body;

    const payload = {
        personType: tipo_conta === 'PJ' ? 'PJ' : 'PF',
        fullName: name,
        cpf: document.replace(/\D/g, ''),
        birthDate: birth_date,
        postalCode: cep.replace(/\D/g, ''),
        externalReference: 'site-user-' + Date.now(),
        portalEmail: email,
        portalPassword: password
    };

    try {
        const response = await axios.post('https://api.goatpay.com.br/v1/subaccount/create', payload, {
            headers: {
                'X-API-Key': 'gp_live_458294d3f396da43a1612e4d8f3cc8d428ad9afdbc01c3be',
                'Content-Type': 'application/json'
            }
        });

        const walletUrl = "https://wallet.goatpay.com.br/login";
        res.render('analise', { walletUrl });
        
    } catch (error) {
        console.error("Erro retornado pela API da GoatPay:", error.response?.data || error.message);
        
        const walletUrl = "https://wallet.goatpay.com.br/login";
        res.render('analise', { walletUrl });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor seguro rodando na porta ${PORT}`);
});
