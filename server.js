const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const GOATPAY_API_URL = 'https://api.goatpay.com.br/v1';
const GOATPAY_TOKEN = 'gp_live_64916c1c4650e2f1fe6b482756c657b32f1d9087170f2dbe';
const ARQUIVO_BANCO = path.join(__dirname, 'usuarios.json');

function limparCpf(cpf) {
    return cpf ? String(cpf).replace(/\D/g, '') : '';
}

function carregarUsuarios() {
    try {
        if (fs.existsSync(ARQUIVO_BANCO)) {
            const dados = fs.readFileSync(ARQUIVO_BANCO, 'utf8');
            return JSON.parse(dados);
        }
    } catch (e) {
        console.error("Erro ao ler banco", e);
    }
    return {};
}

function salvarUsuarios(usuarios) {
    try {
        fs.writeFileSync(ARQUIVO_BANCO, JSON.stringify(usuarios, null, 2));
    } catch (e) {
        console.error("Erro ao salvar banco", e);
    }
}

app.get('/', (req, res) => { res.render('splash'); });
app.get('/login', (req, res) => { res.render('login', { mensagem: req.query.msg || "" }); });
app.get('/fazer-login', (req, res) => { res.redirect('/login'); });
app.get('/cadastro', (req, res) => { res.render('cadastro'); });

// Cadastro limpo
app.post('/criar-conta', async (req, res) => {
    const tipo = req.body.tipo || req.body.personType || "PF";
    const nome = req.body.nome || req.body.fullName;
    const cpfOriginal = req.body.cpf;
    const cpfLimpo = limparCpf(cpfOriginal);
    const nascimento = req.body.nascimento || req.body.birthDate;
    const cep = req.body.cep || req.body.postalCode;
    const senha = req.body.senha;

    try {
        await axios.post(`${GOATPAY_API_URL}/subaccount/create`, {
            personType: tipo,
            fullName: nome,
            cpf: cpfOriginal,
            birthDate: nascimento,
            postalCode: cep,
            externalReference: `MD_${Date.now()}`
        }, {
            headers: { 'X-API-Key': GOATPAY_TOKEN, 'Content-Type': 'application/json' }
        });

        let usuarios = carregarUsuarios();
        usuarios[cpfLimpo] = { nomeCompleto: nome, cpf: cpfLimpo, senha: String(senha).trim() };
        salvarUsuarios(usuarios);

        res.render('analise');
    } catch (error) {
        res.send(`Erro ao criar subconta na GoatPay: <pre>${JSON.stringify(error.response?.data || error.message, null, 2)}</pre>`);
    }
});

app.get('/analise', (req, res) => { res.render('analise'); });
app.get('/liberar-login', (req, res) => { res.redirect('/login?msg=Conta aprovada! Faça login com sua senha.'); });

// Login com validação rígida de senha
app.post('/fazer-login', async (req, res) => {
    const cpfDigitado = String(req.body.cpf || "").trim();
    const senhaDigitada = String(req.body.senha || "").trim();
    const cpfLimpo = limparCpf(cpfDigitado);
    
    let usuarios = carregarUsuarios();
    let usuarioCadastrado = usuarios[cpfLimpo] || usuarios[cpfDigitado];

    // Bloqueia se o usuário não existir ou se a senha estiver incorreta
    if (!usuarioCadastrado || String(usuarioCadastrado.senha).trim() !== senhaDigitada) {
        return res.redirect('/login?msg=CPF ou senha incorretos!');
    }

    let saldoReal = 0.00;
    try {
        const respostaWallet = await axios.get(`${GOATPAY_API_URL}/wallet/balance?cpf=${cpfLimpo}`, {
            headers: { 'X-API-Key': GOATPAY_TOKEN }
        });
        if (respostaWallet.data?.balance) saldoReal = respostaWallet.data.balance;
    } catch (e) {
        saldoReal = 0.00;
    }

    let usuario = { cpf: cpfLimpo, saldo: saldoReal };
    res.render('index', { usuario });
});

// Enviar Pix
app.get('/pix-enviar', (req, res) => { res.render('pix-enviar', { resultado: null }); });
app.post('/pix-enviar', async (req, res) => {
    const { chave, valor } = req.body;
    try {
        await axios.post(`${GOATPAY_API_URL}/pix/send`, {
            key: chave, amount: parseFloat(valor), externalReference: `PIX_OUT_${Date.now()}`
        }, {
            headers: { 'X-API-Key': GOATPAY_TOKEN, 'Content-Type': 'application/json' }
        });
        res.render('pix-enviar', { resultado: "Pix enviado com sucesso!" });
    } catch (error) {
        res.render('pix-enviar', { resultado: "Erro ao enviar Pix. Verifique os dados e saldo." });
    }
});

// Receber Pix
app.get('/pix-receber', (req, res) => { 
    res.render('pix-receber', { qrcode: null, valorGerado: null }); 
});
app.post('/pix-receber', async (req, res) => {
    const { valor } = req.body;
    try {
        const respostaQr = await axios.post(`${GOATPAY_API_URL}/pix/qrcode`, {
            amount: parseFloat(valor),
            externalReference: `PIX_IN_${Date.now()}`
        }, {
            headers: { 'X-API-Key': GOATPAY_TOKEN, 'Content-Type': 'application/json' }
        });

        res.render('pix-receber', { 
            qrcode: respostaQr.data.qrCode || respostaQr.data.pixCopiaECola || "Pix gerado com sucesso na GoatPay",
            valorGerado: valor
        });
    } catch (error) {
        res.render('pix-receber', { qrcode: "Erro ao gerar QR Code. Tente novamente.", valorGerado: null });
    }
});

// Extrato
app.get('/extrato', async (req, res) => {
    let extratoReal = [];
    try {
        const respostaExtrato = await axios.get(`${GOATPAY_API_URL}/wallet/statement`, {
            headers: { 'X-API-Key': GOATPAY_TOKEN }
        });
        extratoReal = respostaExtrato.data?.statements || [];
    } catch (e) {
        extratoReal = [];
    }
    res.render('extrato', { usuario: { saldo: 0 }, extrato: extratoReal });
});

app.listen(PORT, () => { console.log(`Servidor rodando na porta ${PORT}`); });
