const socket = io();

const nomeInput = document.getElementById("nome");
const btnEntrar = document.getElementById("btnEntrar");
const statusBox = document.getElementById("status");
const connectionBadge = document.getElementById("connectionBadge");
const actionButtons = Array.from(document.querySelectorAll(".action-button"));

let loggedIn = false;
const locallyPressed = new Set();

function atualizarStatus(texto, tipo = "info") {
  statusBox.className = `status ${tipo}`;
  statusBox.textContent = texto;
}

function setOnlineBadge(isOnline) {
  connectionBadge.textContent = isOnline ? "Conectado" : "Desconectado";
  connectionBadge.className = `badge ${isOnline ? "online" : "offline"}`;
}

function enablePanel(enabled) {
  actionButtons.forEach((button) => {
    button.disabled = !enabled;
  });
}

function pressButton(buttonId, buttonElement) {
  if (!loggedIn || locallyPressed.has(buttonId)) return;
  locallyPressed.add(buttonId);
  buttonElement.classList.add("pressing");
  socket.emit("button-press", { buttonId });
}

function releaseButton(buttonId, buttonElement) {
  if (!locallyPressed.has(buttonId)) return;
  locallyPressed.delete(buttonId);
  buttonElement.classList.remove("pressing");
  socket.emit("button-release", { buttonId });
}

function bindHoldEvents(buttonElement) {
  const buttonId = Number(buttonElement.dataset.buttonId);

  buttonElement.addEventListener("mousedown", (event) => {
    event.preventDefault();
    pressButton(buttonId, buttonElement);
  });

  buttonElement.addEventListener("mouseup", () => {
    releaseButton(buttonId, buttonElement);
  });

  buttonElement.addEventListener("mouseleave", () => {
    releaseButton(buttonId, buttonElement);
  });

  buttonElement.addEventListener("touchstart", (event) => {
    event.preventDefault();
    pressButton(buttonId, buttonElement);
  }, { passive: false });

  buttonElement.addEventListener("touchend", () => {
    releaseButton(buttonId, buttonElement);
  });

  buttonElement.addEventListener("touchcancel", () => {
    releaseButton(buttonId, buttonElement);
  });
}

actionButtons.forEach(bindHoldEvents);

btnEntrar.addEventListener("click", () => {
  const nome = nomeInput.value.trim();

  if (!nome) {
    atualizarStatus("Informe um nome antes de entrar.", "alerta");
    return;
  }

  socket.emit("registrar", nome);
  nomeInput.disabled = true;
  btnEntrar.disabled = true;
  loggedIn = true;
  enablePanel(true);
  atualizarStatus(`Conectado como ${nome}. Pressione e segure qualquer botão para acionar.`, "sucesso");
});

socket.on("button-states", (states) => {
  states.forEach((state) => {
    const button = document.querySelector(`[data-button-id="${state.id}"]`);
    if (!button) return;

    button.classList.toggle("active", state.active);
    const stateLabel = button.querySelector(".action-state");
    stateLabel.textContent = state.active ? "Acionado" : "Livre";
  });
});

socket.on("status", (data) => {
  const tipo = data.tipo === "sucesso" ? "sucesso" : "info";
  atualizarStatus(data.mensagem, tipo);
});

socket.on("connect", () => {
  setOnlineBadge(true);
  if (!loggedIn) {
    atualizarStatus("Conectado ao servidor. Digite seu nome e clique em Entrar.", "info");
  }
});

socket.on("disconnect", () => {
  setOnlineBadge(false);
  locallyPressed.clear();
  actionButtons.forEach((button) => button.classList.remove("pressing"));
  enablePanel(false);
  loggedIn = false;
  nomeInput.disabled = false;
  btnEntrar.disabled = false;
  atualizarStatus("Conexão com o servidor foi perdida.", "alerta");
});

window.addEventListener("mouseup", () => {
  actionButtons.forEach((button) => {
    const buttonId = Number(button.dataset.buttonId);
    releaseButton(buttonId, button);
  });
});

window.addEventListener("touchend", () => {
  actionButtons.forEach((button) => {
    const buttonId = Number(button.dataset.buttonId);
    releaseButton(buttonId, button);
  });
});

window.addEventListener("beforeunload", () => {
  actionButtons.forEach((button) => {
    const buttonId = Number(button.dataset.buttonId);
    if (locallyPressed.has(buttonId)) {
      socket.emit("button-release", { buttonId });
    }
  });
});

setOnlineBadge(false);
enablePanel(false);
