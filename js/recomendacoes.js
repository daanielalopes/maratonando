/* ============================================================
   Recomendações via TMDB
   ------------------------------------------------------------
   1. usuário digita a última série que assistiu
   2. /search/tv  -> encontra a série e o id
   3. /tv/{id}/recommendations -> séries recomendadas
   4. exibe como pôsteres na prateleira "recomendações"
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

  async function buscarSerie(nome) {
    const res = await fetch(tmdbUrl("/search/tv", { query: nome, include_adult: "false" }));
    if (!res.ok) throw new Error("Não foi possível buscar a série (" + res.status + ").");
    const data = await res.json();
    return (data.results && data.results[0]) || null;
  }

  async function buscarRecomendacoes(id) {
    const res = await fetch(tmdbUrl("/tv/" + id + "/recommendations"));
    if (!res.ok) throw new Error("Não foi possível carregar as recomendações (" + res.status + ").");
    const data = await res.json();
    return data.results || [];
  }

  const esc = (window.CINE && window.CINE.escapeAttr) || ((s) => String(s || ""));

  function posterFromTmdb(s) {
    const el = document.createElement("button");
    el.className = "poster";
    el.type = "button";
    const img = s.poster_path
      ? `<img src="${IMG}${s.poster_path}" alt="${esc(s.name)}" loading="lazy" />`
      : `<img class="broken" alt="${esc(s.name)}" />`;
    const ano = (s.first_air_date || "").slice(0, 4);
    const nota = s.vote_average ? `⭐ ${Number(s.vote_average).toFixed(1)}` : "";
    el.innerHTML = `
      ${img}
      <div class="poster-shine"></div>
      <div class="poster-info">
        <span class="poster-title">${esc(s.name)}</span>
        <span class="poster-tag">${ano ? ano + " · " : ""}${nota}</span>
      </div>`;
    el.addEventListener("click", () => {
      if (window.CINE) window.CINE.openModal({
        titulo: s.name + (ano ? ` (${ano})` : ""),
        genero: nota || "série",
        img: s.poster_path ? IMG + s.poster_path : "",
        sinopse: s.overview || "Sinopse não disponível em português.",
        trailer: "https://www.youtube.com/results?search_query=" + encodeURIComponent(s.name + " trailer")
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

    setStatus("buscando recomendações…");

    try {
      const serie = await buscarSerie(nome);
      if (!serie) {
        setStatus(`Não encontramos "${nome}". Tente escrever de outra forma ou em inglês.`, true);
        shelf.hidden = true;
        return;
      }

      const recs = await buscarRecomendacoes(serie.id);
      if (!recs.length) {
        setStatus(`Encontramos "${serie.name}", mas não há recomendações. Tente outra série.`, true);
        shelf.hidden = true;
        return;
      }

      setStatus("");
      shelfTitle.textContent = `✨ porque você assistiu ${serie.name}`;
      results.innerHTML = "";
      recs.slice(0, 14).forEach((s) => results.appendChild(posterFromTmdb(s)));
      shelf.hidden = false;
      shelf.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      setStatus(err.message || "Ocorreu um erro na busca.", true);
      shelf.hidden = true;
    }
  });
})();
