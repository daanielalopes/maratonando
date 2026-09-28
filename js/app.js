/* ============================================================
   maratonando ✦ — interface (prateleiras + abas + modal)
   Aba "Séries": prateleiras locais por gênero (window.CATALOGO)
   Aba "Filmes": prateleiras puxadas do TMDB (em alta / por gênero)
   Clique num pôster abre o modal com sinopse e trailer.
   ============================================================ */
(function () {
  const catalogo = window.CATALOGO || [];
  const generos = window.GENEROS || [];
  const shelves = document.getElementById("shelves");
  const cfg = window.TMDB_CONFIG || {};
  const API = "https://api.themoviedb.org/3";
  const IMG = "https://image.tmdb.org/t/p/w400";

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function escapeAttr(s) { return escapeHtml(s); }

  function tmdbUrl(path, params) {
    const url = new URL(API + path);
    url.searchParams.set("api_key", cfg.API_KEY || "");
    url.searchParams.set("language", cfg.LANG || "pt-BR");
    Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));
    return url.toString();
  }

  /* ---------- Card de pôster (conteúdo local) ---------- */
  function posterCardLocal(item) {
    const el = document.createElement("button");
    el.className = "poster"; el.type = "button";
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

  /* ---------- Card de pôster (filme do TMDB) ---------- */
  function posterCardMovie(m) {
    const el = document.createElement("button");
    el.className = "poster"; el.type = "button";
    const titulo = m.title || m.name || "";
    const ano = (m.release_date || "").slice(0, 4);
    const nota = m.vote_average ? `⭐ ${Number(m.vote_average).toFixed(1)}` : "";
    const img = m.poster_path
      ? `<img src="${IMG}${m.poster_path}" alt="${escapeAttr(titulo)}" loading="lazy" />`
      : `<img class="broken" alt="${escapeAttr(titulo)}" />`;
    el.innerHTML = `
      ${img}
      <div class="poster-shine"></div>
      <div class="poster-info">
        <span class="poster-title">${escapeHtml(titulo)}</span>
        <span class="poster-tag">${ano ? ano + " · " : ""}${nota}</span>
      </div>`;
    el.addEventListener("click", () => openModal({
      titulo: titulo + (ano ? ` (${ano})` : ""),
      genero: "filme",
      img: m.poster_path ? IMG + m.poster_path : "",
      sinopse: m.overview || "Sinopse não disponível em português.",
      tmdbId: m.id, tmdbTipo: "movie"
    }));
    return el;
  }

  function makeShelf(id, titulo) {
    const section = document.createElement("section");
    section.className = "shelf";
    if (id) section.id = id;
    section.innerHTML = `<h2 class="shelf-title">${titulo}</h2>`;
    const row = document.createElement("div");
    row.className = "row";
    section.appendChild(row);
    shelves.appendChild(section);
    return row;
  }

  /* ---------- Aba Séries (local) ---------- */
  function renderSeries() {
    shelves.innerHTML = "";
    generos.forEach((g) => {
      const items = catalogo.filter((s) => s.genero === g.key);
      if (!items.length) return;
      const row = makeShelf("genero-" + g.key, `${g.emoji} ${escapeHtml(g.label)}`);
      items.forEach((it) => row.appendChild(posterCardLocal(it)));
    });
  }

  /* ---------- Aba Filmes (TMDB) ---------- */
  // gêneros de filme no TMDB (ids oficiais)
  const MOVIE_SHELVES = [
    { titulo: "🔥 Em alta", path: "/trending/movie/week", params: {} },
    { titulo: "💥 Ação", path: "/discover/movie", params: { with_genres: "28", sort_by: "popularity.desc" } },
    { titulo: "😂 Comédia", path: "/discover/movie", params: { with_genres: "35", sort_by: "popularity.desc" } },
    { titulo: "😱 Terror", path: "/discover/movie", params: { with_genres: "27", sort_by: "popularity.desc" } },
    { titulo: "🎭 Drama", path: "/discover/movie", params: { with_genres: "18", sort_by: "popularity.desc" } }
  ];

  let filmesCarregados = false;
  async function renderFilmes() {
    shelves.innerHTML = "";
    if (!cfg.API_KEY) {
      shelves.innerHTML = `<p class="empty-msg">configure a chave do TMDB em <code>js/config.js</code> pra ver os filmes ✦</p>`;
      return;
    }
    for (const s of MOVIE_SHELVES) {
      const row = makeShelf(null, s.titulo);
      row.innerHTML = `<p class="empty-msg">carregando…</p>`;
      try {
        const res = await fetch(tmdbUrl(s.path, s.params));
        const data = await res.json();
        row.innerHTML = "";
        (data.results || []).slice(0, 16).forEach((m) => row.appendChild(posterCardMovie(m)));
        if (!row.children.length) row.innerHTML = `<p class="empty-msg">nada por aqui.</p>`;
      } catch (err) {
        row.innerHTML = `<p class="empty-msg">não rolou carregar essa prateleira 😢</p>`;
      }
    }
    filmesCarregados = true;
  }

  /* ---------- Abas ---------- */
  const tabs = document.querySelectorAll(".cat-tab");
  tabs.forEach((tab) => tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.toggle("active", t === tab));
    if (tab.dataset.tab === "filmes") renderFilmes();
    else renderSeries();
  }));

  /* ---------- Modal ---------- */
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modal-body");

  function ytId(url) {
    const m = String(url || "").match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
    return m ? m[1] : null;
  }

  // busca o id do trailer (YouTube) real no TMDB, quando temos o id do título
  async function trailerIdTMDB(tipo, id) {
    if (!cfg.API_KEY || !tipo || !id) return null;
    // tenta no idioma configurado; se não achar, tenta em inglês
    for (const lang of [cfg.LANG || "pt-BR", "en-US"]) {
      try {
        const url = new URL(API + "/" + tipo + "/" + id + "/videos");
        url.searchParams.set("api_key", cfg.API_KEY);
        url.searchParams.set("language", lang);
        const res = await fetch(url.toString());
        if (!res.ok) continue;
        const data = await res.json();
        const vids = (data.results || []).filter((v) => v.site === "YouTube");
        const trailer =
          vids.find((v) => v.type === "Trailer" && v.official) ||
          vids.find((v) => v.type === "Trailer") ||
          vids.find((v) => v.type === "Teaser") ||
          vids[0];
        if (trailer) return trailer.key;
      } catch (e) { /* tenta próximo idioma */ }
    }
    return null;
  }

  function buscaYoutube(titulo) {
    return "https://www.youtube.com/results?search_query=" + encodeURIComponent(titulo + " trailer");
  }

  function renderModal(item, embedId) {
    const media = embedId
      ? `<div class="modal-video"><iframe src="https://www.youtube.com/embed/${embedId}" title="trailer" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
      : `<div class="modal-poster"><img src="${escapeAttr(item.img)}" alt="${escapeAttr(item.titulo)}" onerror="this.parentNode.style.display='none'" /></div>`;
    // link: se temos o trailer, aponta direto; senão, busca no YouTube
    const link = embedId ? ("https://www.youtube.com/watch?v=" + embedId) : buscaYoutube(item.titulo);
    modalBody.innerHTML = `
      ${media}
      <div class="modal-text">
        <span class="modal-tag">${escapeHtml(item.genero)}</span>
        <h2>${escapeHtml(item.titulo)}</h2>
        <p>${escapeHtml(item.sinopse || "")}</p>
        <a class="modal-trailer" href="${escapeAttr(link)}" target="_blank" rel="noopener">▸ ${embedId ? "ver trailer no YouTube" : "procurar trailer no YouTube"}</a>
      </div>`;
  }

  async function openModal(item) {
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    // 1) se o item já traz um link de trailer do YouTube "de verdade", usa
    let embedId = ytId(item.trailer);

    // 2) mostra imediatamente (com o que temos) para não travar
    renderModal(item, embedId);

    // 3) se ainda não temos vídeo mas temos o id do TMDB, busca o trailer real
    if (!embedId && item.tmdbId && item.tmdbTipo) {
      renderModal(item, null); // garante o pôster enquanto busca
      const key = await trailerIdTMDB(item.tmdbTipo, item.tmdbId);
      // só atualiza se o modal ainda estiver aberto no mesmo item
      if (key && !modal.classList.contains("hidden")) {
        renderModal(item, key);
      }
    }
  }
  function closeModal() {
    modal.classList.add("hidden");
    modalBody.innerHTML = "";
    document.body.style.overflow = "";
  }
  document.getElementById("modal-close").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  // expõe para o recomendador reutilizar
  window.CINE = { openModal, closeModal, escapeHtml, escapeAttr };

  /* ============================================================
     SURPREENDA-ME — sorteia um filme ou série e abre no modal
     ============================================================ */
  const surpriseBtn = document.getElementById("surprise-btn");
  const statusEl = document.getElementById("rec-status");

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function surpresaLocal() {
    if (!catalogo.length) return false;
    openModal(pick(catalogo));
    return true;
  }

  async function surpresaTMDB() {
    // sorteia tipo (filme/série) e uma página aleatória do "em alta"
    const tipo = Math.random() < 0.5 ? "movie" : "tv";
    const page = 1 + Math.floor(Math.random() * 5);
    const res = await fetch(tmdbUrl("/trending/" + tipo + "/week", { page: String(page) }));
    if (!res.ok) throw new Error("falha");
    const data = await res.json();
    const lista = (data.results || []).filter((x) => x.overview);
    if (!lista.length) throw new Error("vazio");
    const item = pick(lista);
    const titulo = item.title || item.name || "";
    const ano = (item.release_date || item.first_air_date || "").slice(0, 4);
    openModal({
      titulo: titulo + (ano ? ` (${ano})` : ""),
      genero: tipo === "movie" ? "filme" : "série",
      img: item.poster_path ? IMG + item.poster_path : "",
      sinopse: item.overview || "Sinopse não disponível em português.",
      tmdbId: item.id, tmdbTipo: tipo
    });
  }

  if (surpriseBtn) {
    surpriseBtn.addEventListener("click", async () => {
      surpriseBtn.disabled = true;
      const original = surpriseBtn.textContent;
      surpriseBtn.textContent = "🎲 pensando aqui…";
      if (statusEl) statusEl.textContent = "";
      try {
        // com chave: metade das vezes tenta o TMDB (catálogo enorme); senão, local
        if (cfg.API_KEY && Math.random() < 0.7) {
          try { await surpresaTMDB(); }
          catch (e) { surpresaLocal(); }
        } else {
          surpresaLocal();
        }
      } finally {
        surpriseBtn.disabled = false;
        surpriseBtn.textContent = original;
      }
    });
  }

  // inicia na aba de séries
  renderSeries();
})();
