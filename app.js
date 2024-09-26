const express = require("express"); // Importa o framework Express.
const { z } = require("zod"); // Importa a biblioteca Zod para validação de dados.
const { Contato } = require('./models'); // Importa o modelo de dados 'Contato'.
const fs = require("fs"); // Módulo para manipulação de arquivos.
const path = require("path"); // Módulo para manipulação de caminhos de arquivos.

const app = express(); 

// Middleware para registrar acessos no arquivo 'access.log'.
app.use((req, res, next) => {
    const log = `${new Date().toISOString()} - ${req.method} ${req.originalUrl}\n`; // Formata a entrada do log.
    fs.appendFile(path.join(__dirname, 'access.log'), log, (err) => { // Escreve no arquivo de log.
        if (err) {
            console.error("Erro ao escrever no arquivo de log:", err); // Loga o erro no console, se ocorrer.
        }
    });
    next(); // Passa para o próximo middleware ou rota.
});

// Esquema de validação para os dados do contato usando Zod.
const contatoSchema = z.object({
    nome: z.string({ message: "Campo nome é obrigatório" }) // Campo obrigatório: string com pelo menos 3 caracteres.
        .min(3, { message: "O nome deve ter no mínimo 03 caracteres." }),

    email: z.string({ message: "Campo e-mail é obrigatório." }) // Campo obrigatório: string com validação de e-mail.
        .email({ message: "Deve ser um e-mail válido." }),

    telefone: z.string() // Campo obrigatório: string com formato específico de telefone.
        .regex(/^\(\d{2}\) \d{5}-\d{4}$/, { message: "Deve enviar um telefone válido" })
});

// Configura o EJS como motor de visualização.
app.set("view engine", "ejs");
// Define o diretório das views (templates).
app.set("views", "./views");
// Middleware para processar dados de formulários com URL-encoded.
app.use(express.urlencoded({ extended: true }));
// Middleware para processar dados JSON.
app.use(express.json());

// Rota GET para a página inicial ("/").
app.get("/", (req, res) => {
    res.render("index"); // Renderiza a view 'index.ejs'.
});

// Rota POST para enviar o formulário da página inicial ("/").
app.post("/", async (req, res) => {
    const contato = req.body; // Captura os dados enviados no formulário.

    // Valida os dados do contato com o esquema definido.
    const resultado = contatoSchema.safeParse(contato);

    if (!resultado.success) { // Se houver erros de validação...
        const erros = resultado.error.issues.map(issue => issue.message); // Extrai as mensagens de erro.
        res.status(400).send(erros.join("; ")); // Retorna status 400 com as mensagens de erro.
    } else {
        // Caso a validação seja bem-sucedida, cria o contato no banco de dados.
        await Contato.create({ nome: contato.nome, telefone: contato.telefone, email: contato.email });
        res.send("Contato salvo com sucesso"); // Retorna mensagem de sucesso.
    }
});

// Rota GET para listar todos os contatos cadastrados.
app.get("/contatos", async (req, res) => {
    try {
        const contatos = await Contato.findAll(); // Busca todos os contatos no banco de dados.
        res.render("contatos", { contatos }); // Renderiza a view 'contatos.ejs' com os dados.
    } catch (error) {
        console.error("Erro ao buscar contatos:", error); // Loga o erro no console.
        res.status(500).send("Erro ao buscar contatos."); // Retorna mensagem de erro genérico.
    }
});

// Inicia o servidor na porta 3000 e loga a mensagem no console quando estiver pronto.
app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
});
