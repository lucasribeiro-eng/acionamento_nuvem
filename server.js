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
const TOTAL_BOTOES = 4;

const buttonStates = Array.from({ length: TOTAL_BOTOES }, (_, index) => ({
  id: index + 1,
  activeUsers: new Set()
}));

app.use(express.static("public"));

app.get("/health", (_, res) => {
  res.json({ ok: true });
});

function serializeStates() {
  return buttonStates.map((button) => ({
    id: button.id,
    active: button.activeUsers.size > 0,
    activeCount: button.activeUsers.size
  }));
}

function emitStates() {
  io.emit("button-states", serializeStates());
}

function validButtonId(buttonId) {
  return Number.isInteger(buttonId) && buttonId >= 1 && buttonId <= TOTAL_BOTOES;
}

function activateButton(socket, buttonId) {
  if (!validButtonId(buttonId)) return;

  const button = buttonStates[buttonId - 1];
  button.activeUsers.add(socket.id);

  if (!socket.data.pressedButtons) {
    socket.data.pressedButtons = new Set();
  }
  socket.data.pressedButtons.add(buttonId);

  emitStates();
}

function releaseButton(socket, buttonId) {
  if (!validButtonId(buttonId)) return;

  const button = buttonStates[buttonId - 1];
  button.activeUsers.delete(socket.id);

  if (socket.data.pressedButtons) {
    socket.data.pressedButtons.delete(buttonId);
  }

  emitStates();
}

io.on("connection", (socket) => {
  console.log("[conectado]", socket.id);

  socket.data.nome = "Usuário";
  socket.data.pressedButtons = new Set();

  socket.emit("button-states", serializeStates());

  socket.on("registrar", (nome) => {
    socket.data.nome = (nome || "Usuário").trim() || "Usuário";
    socket.emit("status", {
      tipo: "info",
      mensagem: `Conectado como ${socket.data.nome}.`
    });
  });

  socket.on("button-press", (payload) => {
    const buttonId = Number(payload?.buttonId);
    activateButton(socket, buttonId);
  });

  socket.on("button-release", (payload) => {
    const buttonId = Number(payload?.buttonId);
    releaseButton(socket, buttonId);
  });

  socket.on("disconnect", () => {
    for (const buttonId of socket.data.pressedButtons) {
      const button = buttonStates[buttonId - 1];
      button.activeUsers.delete(socket.id);
    }
    emitStates();
    console.log("[desconectado]", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
