/* ============================================================
   Recomendações de séries via TMDB
   ------------------------------------------------------------
   Fluxo:
   1. usuário digita a última série que assistiu
   2. /search/tv  -> encontra a série e o id
   3. /tv/{id}/recommendations -> séries recomendadas
   4. exibe os resultados (pôster, nota, sinopse)
   ============================================================ */
(function () {
  const cfg = window.TMDB_CONFIG || {};
  const API = "https://api.themoviedb.org/3";
  const IMG = "https://image.tmdb.org/t/p/w300";

  const form = document.getElementById("rec-form");
  const input = document.getElementById("rec-input");
  const results = document.getElementById("rec-results");
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

  function cardSerie(s) {
    const poster = s.poster_path
      ? `<img src="${IMG}${s.poster_path}" alt="${escapeAttr(s.name)}" loading="lazy" />`
      : `<div class="rec-noimg">sem imagem</div>`;
    const nota = s.vote_average ? `⭐ ${Number(s.vote_average).toFixed(1)}` : "sem nota";
    const ano = (s.first_air_date || "").slice(0, 4);
    const sinopse = s.overview
      ? escapeHtml(s.overview)
      : "Sinopse não disponível em português.";
    return `
      <article class="rec-card">
        <div class="rec-poster">${poster}</div>
        <div class="rec-info">
          <h3>${escapeHtml(s.name)} ${ano ? `<span class="rec-ano">(${ano})</span>` : ""}</h3>
          <div class="rec-nota">${nota}</div>
          <p>${sinopse}</p>
        </div>
      </article>`;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = input.value.trim();
    if (!nome) return;

    if (!cfg.API_KEY) {
      setStatus("Chave da API do TMDB não configurada (veja js/config.js).", true);
      return;
    }

    results.innerHTML = "";
    setStatus("buscando recomendações…");

    try {
      const serie = await buscarSerie(nome);
      if (!serie) {
        setStatus(`Não encontramos a série "${nome}". Tente escrever o nome em inglês ou de outra forma.`, true);
        return;
      }

      const recs = await buscarRecomendacoes(serie.id);
      if (!recs.length) {
        setStatus(`Encontramos "${serie.name}", mas o TMDB não trouxe recomendações. Tente outra série.`, true);
        return;
      }

      setStatus(`porque você assistiu ${serie.name}, você pode gostar de:`);
      results.innerHTML = recs.slice(0, 12).map(cardSerie).join("");
    } catch (err) {
      setStatus(err.message || "Ocorreu um erro na busca.", true);
    }
  });

  // utilidades de escape (evita HTML injetado nas sinopses/títulos)
  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function escapeAttr(s) { return escapeHtml(s); }
})();
