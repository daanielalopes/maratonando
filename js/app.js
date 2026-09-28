/* ============================================================
   CINE·SÉRIES — interface (prateleiras + modal)
   Monta as prateleiras por gênero a partir de window.CATALOGO
   e abre um modal com sinopse e trailer ao clicar num pôster.
   ============================================================ */
(function () {
  const catalogo = window.CATALOGO || [];
  const generos = window.GENEROS || [];
  const shelves = document.getElementById("shelves");

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function escapeAttr(s) { return escapeHtml(s); }

  /* ---------- Card de pôster ---------- */
  function posterCard(item, index) {
    const el = document.createElement("button");
    el.className = "poster";
    el.type = "button";
    el.innerHTML = `
      <img src="${escapeAttr(item.img)}" alt="${escapeAttr(item.titulo)}" loading="lazy"
           onerror="this.classList.add('broken')" />
      <div class="poster-shine"></div>
      <div class="poster-info">
        <span class="poster-title">${escapeHtml(item.titulo)}</span>
        <span class="poster-tag">${escapeHtml(item.genero)}</span>
      </div>`;
    el.addEventListener("click", () => openModal(item));
    return el;
  }

  /* ---------- Prateleiras por gênero ---------- */
  function renderShelves() {
    generos.forEach((g) => {
      const items = catalogo.filter((s) => s.genero === g.key);
      if (!items.length) return;
      const section = document.createElement("section");
      section.className = "shelf";
      section.id = "genero-" + g.key;
      section.innerHTML = `<h2 class="shelf-title">${g.emoji} ${escapeHtml(g.label)}</h2>`;
      const row = document.createElement("div");
      row.className = "row";
      items.forEach((it, i) => row.appendChild(posterCard(it, i)));
      section.appendChild(row);
      shelves.appendChild(section);
    });
  }

  /* ---------- Modal ---------- */
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modal-body");

  function ytEmbed(url) {
    // extrai o id do youtube (youtu.be/ID ou watch?v=ID); senão retorna null
    const m = String(url || "").match(/(?:youtu\.be\/|v=)([\w-]{11})/);
    return m ? "https://www.youtube.com/embed/" + m[1] : null;
  }

  function openModal(item) {
    const embed = ytEmbed(item.trailer);
    const media = embed
      ? `<div class="modal-video"><iframe src="${embed}" title="trailer" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
      : `<div class="modal-poster"><img src="${escapeAttr(item.img)}" alt="${escapeAttr(item.titulo)}" /></div>`;
    modalBody.innerHTML = `
      ${media}
      <div class="modal-text">
        <span class="modal-tag">${escapeHtml(item.genero)}</span>
        <h2>${escapeHtml(item.titulo)}</h2>
        <p>${escapeHtml(item.sinopse || "")}</p>
        ${item.trailer ? `<a class="modal-trailer" href="${escapeAttr(item.trailer)}" target="_blank" rel="noopener">▸ ver trailer no YouTube</a>` : ""}
      </div>`;
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    modal.classList.add("hidden");
    modalBody.innerHTML = ""; // para o vídeo
    document.body.style.overflow = "";
  }
  document.getElementById("modal-close").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  // expõe openModal para o recomendador (TMDB) reutilizar o mesmo modal
  window.CINE = { openModal, closeModal, escapeHtml, escapeAttr };

  renderShelves();
})();
