/* ============================================================
   Recomendações via TMDB — filmes OU séries
   ------------------------------------------------------------
   O usuário escolhe o tipo (📺 série = tv | 🎬 filme = movie),
   digita o título e recebe recomendações do mesmo tipo.
     tv:    /search/tv    + /tv/{id}/recommendations
     movie: /search/movie + /movie/{id}/recommendations
   ============================================================ */
(function () {
  const cfg = window.TMDB_CONFIG || {};
  const API = "https://api.themoviedb.org/3";
  const IMG = "https://image.tmdb.org/t/p/w400";

  const form = document.getElementById("rec-form");
  const input = document.getElementById("rec-input");
  const shelf = document.getElementById("recomendador");
  const results = document.getElementById("rec-results");
  const shelfTitle = document.getElementById("rec-shelf-title");
  const statusEl = document.getElementById("rec-status");
  if (!form) return;

  function tipoSelecionado() {
    const el = form.querySelector('input[name="tipo"]:checked');
    return el ? el.value : "tv";
  }
  // adapta campos que diferem entre filme e série
  const tituloDe = (x) => x.name || x.title || "";
  const anoDe = (x) => (x.first_air_date || x.release_date || "").slice(0, 4);

  function setStatus(msg, isError) {
    statusEl.textContent = msg || "";
    statusEl.className = "rec-status" + (isError ? " rec-error" : "");
  }

  function tmdbUrl(path, params) {
    const url = new URL(API + path);
    url.searchParams.set("api_key", cfg.API_KEY || "");
    url.searchParams.set("language", cfg.LANG || "pt-BR");
    Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));
    return url.toString();
  }

  async function buscarTitulo(tipo, nome) {
    const res = await fetch(tmdbUrl("/search/" + tipo, { query: nome, include_adult: "false" }));
    if (!res.ok) throw new Error("Não foi possível buscar (" + res.status + ").");
    const data = await res.json();
    return (data.results && data.results[0]) || null;
  }

  async function buscarRecomendacoes(tipo, id) {
    const res = await fetch(tmdbUrl("/" + tipo + "/" + id + "/recommendations"));
    if (!res.ok) throw new Error("Não foi possível carregar as recomendações (" + res.status + ").");
    const data = await res.json();
    return data.results || [];
  }

  const esc = (window.CINE && window.CINE.escapeAttr) || ((s) => String(s || ""));

  function posterFromTmdb(item, tipo) {
    const el = document.createElement("button");
    el.className = "poster";
    el.type = "button";
    const titulo = tituloDe(item);
    const img = item.poster_path
      ? `<img src="${IMG}${item.poster_path}" alt="${esc(titulo)}" loading="lazy" />`
      : `<img class="broken" alt="${esc(titulo)}" />`;
    const ano = anoDe(item);
    const nota = item.vote_average ? `⭐ ${Number(item.vote_average).toFixed(1)}` : "";
    el.innerHTML = `
      ${img}
      <div class="poster-shine"></div>
      <div class="poster-info">
        <span class="poster-title">${esc(titulo)}</span>
        <span class="poster-tag">${ano ? ano + " · " : ""}${nota}</span>
      </div>`;
    el.addEventListener("click", () => {
      if (window.CINE) window.CINE.openModal({
        titulo: titulo + (ano ? ` (${ano})` : ""),
        genero: tipo === "movie" ? "filme" : "série",
        img: item.poster_path ? IMG + item.poster_path : "",
        sinopse: item.overview || "Sinopse não disponível em português.",
        trailer: "https://www.youtube.com/results?search_query=" + encodeURIComponent(titulo + " trailer")
      });
    });
    return el;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = input.value.trim();
    if (!nome) return;

    if (!cfg.API_KEY) {
      setStatus("Chave da API do TMDB não configurada (veja js/config.js).", true);
      return;
    }

    const tipo = tipoSelecionado();
    const rotulo = tipo === "movie" ? "filme" : "série";
    setStatus("buscando recomendações…");

    try {
      const item = await buscarTitulo(tipo, nome);
      if (!item) {
        setStatus(`Não encontramos o ${rotulo} "${nome}". Tente escrever de outra forma ou em inglês.`, true);
        shelf.hidden = true;
        return;
      }

      const recs = await buscarRecomendacoes(tipo, item.id);
      if (!recs.length) {
        setStatus(`Encontramos "${tituloDe(item)}", mas não há recomendações. Tente outro título.`, true);
        shelf.hidden = true;
        return;
      }

      setStatus("");
      shelfTitle.textContent = `✨ porque você viu ${tituloDe(item)}`;
      results.innerHTML = "";
      recs.slice(0, 14).forEach((r) => results.appendChild(posterFromTmdb(r, tipo)));
      shelf.hidden = false;
      shelf.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      setStatus(err.message || "Ocorreu um erro na busca.", true);
      shelf.hidden = true;
    }
  });
})();
