const express = require('express');
const mysql = require('mysql');
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use('/imagens', express.static('imagens'));

const porta = 3000;

// Configuração do banco de dados
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'pdm'
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Conexão com o banco estabelecida');
});

// Configuração do Multer para manipulação de upload de imagens
const storage = multer.diskStorage({
  destination(req, file, cb) {
      cb(null, './imagens');
  },
  filename(req, file, cb) {
      // Apenas o nome do arquivo, com um prefixo de timestamp para evitar duplicatas
      cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Rotas times
//Exibir
app.get('/times', (req, res) => {
  db.query('SELECT * FROM times', (err, result) => {
    if (err) throw err;
    res.json(result);
  });
});

//Cadastro
app.post('/upload', upload.single('imagem'), (req, res) => {
  const nome = req.body.nome;
  const imagem = req.file.filename;

  db.query("INSERT INTO times (nome, imagem) VALUES (?, ?)", [nome, imagem], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send({ mensagem: err })
    } else {
      res.status(201).send({
        data: {
          nome: nome,
          imagem: imagem,
          url_imagem: `http://${req.hostname}:${porta}/imagens/${imagem}`
        },
        mensagem: "Time cadastrado com sucesso"
      });
    }
  });
});

//Delete
app.delete('/times/:id', (req, res) => {
  const id = req.params.id;
  db.query('DELETE FROM times WHERE id = ?', [id], (err, result) => {
    if (err) {
      res.status(500).send({ mensagem: 'Erro ao deletar', error: err.message });
    } else {
      res.send({ mensagem: 'Apagado' });
    }
  });
});

//Update
app.put('/times/:id', upload.single('imagem'), (req, res) => {
  const id = req.params.id;
  const nome = req.body.nome;
  const imagem = req.file ? req.file.filename : null;

  const sql = 'UPDATE times SET nome = ?, imagem = COALESCE(?, imagem) WHERE id = ?';
  const params = [nome, imagem, id];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send({ mensagem: 'Erro ao atualizar o time' });
    } else {
      res.send({ mensagem: 'Time atualizado com sucesso', id });
    }
  });
});

// Rota jogadores
//Exibir
app.get('/jogadores/:timeId', (req, res) => {
  const timeId = req.params.timeId;
  db.query('SELECT * FROM jogadores WHERE time_id = ?', [timeId], (err, results) => {
      if (err) {
          console.error(err);
          return res.status(500).send({ mensagem: 'Erro ao buscar jogadores' });
      }
      res.json(results);
  });
});
//Cadastro
app.post('/jogadores', (req, res) => {
  console.log('Iniciando cadastro de jogador')
  const { nome, posicao, time_id } = req.body;
  db.query('INSERT INTO jogadores (nome, posicao, time_id) VALUES (?, ?, ?)', [nome, posicao, time_id], (err, result) => {
      if (err) {
          console.error(err);
          return res.status(500).send({ mensagem: 'Erro ao adicionar jogador' });
      }
      res.status(201).send({ mensagem: 'Jogador adicionado com sucesso', jogadorId: result.insertId });
  });
});
app.listen(porta, () => {
  console.log(`Servidor rodando em http://localhost:${porta}`);
});
