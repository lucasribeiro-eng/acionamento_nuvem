const socket = io();

const nomeInput = document.getElementById("nome");
const btnEntrar = document.getElementById("btnEntrar");
const btnAcionar = document.getElementById("btnAcionar");
const statusBox = document.getElementById("status");
const historico = document.getElementById("historico");

function atualizarStatus(texto, tipo = "info") {
  statusBox.className = `status ${tipo}`;
  statusBox.textContent = texto;
}

function adicionarHistorico(texto) {
  const item = document.createElement("li");
  item.textContent = texto;
  historico.prepend(item);
}

btnEntrar.addEventListener("click", () => {
  const nome = nomeInput.value.trim();

  if (!nome) {
    atualizarStatus("Informe um nome antes de entrar.", "alerta");
    return;
  }

  socket.emit("registrar", nome);
  nomeInput.disabled = true;
  btnEntrar.disabled = true;
  btnAcionar.disabled = false;

  atualizarStatus(`Conectado como ${nome}.`, "sucesso");
  adicionarHistorico(`Você entrou como ${nome}.`);
});

btnAcionar.addEventListener("click", () => {
  socket.emit("acionar");
  adicionarHistorico("Você acionou o botão.");
});

socket.on("acionamento", (data) => {
  const texto = `${data.mensagem} às ${data.horario}.`;
  atualizarStatus(texto, "sucesso");
  adicionarHistorico(texto);
});

socket.on("status", (data) => {
  const tipo = data.tipo === "sucesso" ? "sucesso" : "info";
  atualizarStatus(`${data.mensagem} (${data.horario})`, tipo);
});

socket.on("connect", () => {
  adicionarHistorico("Conectado ao servidor da nuvem.");
});

socket.on("disconnect", () => {
  atualizarStatus("Conexão com o servidor foi perdida.", "alerta");
  adicionarHistorico("Conexão com o servidor foi perdida.");
  btnAcionar.disabled = true;
});
