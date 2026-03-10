const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

app.get("/health", (_, res) => {
  res.json({ ok: true });
});

io.on("connection", (socket) => {
  console.log("[conectado]", socket.id);

  socket.on("registrar", (nome) => {
    socket.data.nome = (nome || "Usuário").trim() || "Usuário";
    socket.emit("status", {
      tipo: "info",
      mensagem: `Conectado como ${socket.data.nome}.`,
      horario: new Date().toLocaleTimeString("pt-BR")
    });
  });

  socket.on("acionar", () => {
    const remetente = socket.data.nome || "Usuário";
    const horario = new Date().toLocaleTimeString("pt-BR");

    socket.broadcast.emit("acionamento", {
      remetente,
      mensagem: `${remetente} acionou o botão`,
      horario
    });

    socket.emit("status", {
      tipo: "sucesso",
      mensagem: "Acionamento enviado com sucesso.",
      horario
    });

    console.log("[acionamento]", remetente, horario);
  });

  socket.on("disconnect", () => {
    console.log("[desconectado]", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
