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
      trailer: "https://www.youtube.com/results?search_query=" + encodeURIComponent(titulo + " trailer")
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

  function ytEmbed(url) {
    const m = String(url || "").match(/(?:youtu\.be\/|v=)([\w-]{11})/);
    return m ? "https://www.youtube.com/embed/" + m[1] : null;
  }
  function openModal(item) {
    const embed = ytEmbed(item.trailer);
    const media = embed
      ? `<div class="modal-video"><iframe src="${embed}" title="trailer" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
      : `<div class="modal-poster"><img src="${escapeAttr(item.img)}" alt="${escapeAttr(item.titulo)}" onerror="this.parentNode.remove()" /></div>`;
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
    modalBody.innerHTML = "";
    document.body.style.overflow = "";
  }
  document.getElementById("modal-close").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  // expõe para o recomendador reutilizar
  window.CINE = { openModal, closeModal, escapeHtml, escapeAttr };

  // inicia na aba de séries
  renderSeries();
})();
