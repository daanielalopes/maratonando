# maratonando ✦

Descubra o que assistir a seguir — filmes **e** séries. Você escolhe o tipo, informa um título que curtiu e recebe recomendações parecidas. Todo o catálogo — séries e filmes, pôsteres, sinopses e trailers — é puxado em tempo real do [TMDB](https://www.themoviedb.org/).

## ✦ Funcionalidades

- 🎬📺 **Seletor Filme / Série** na busca de recomendações
- 🤖 **Recomendações** via API do TMDB (`/search` + `/recommendations`)
- 🗂️ **Catálogo com abas**: Séries e Filmes (em alta / por gênero), tudo via TMDB
- 🎲 **Decide por mim** — sorteia um filme ou série aleatório do TMDB
- 🔎 **Modal** com sinopse e trailer ao clicar em qualquer título
- 🌙 Visual escuro com pegada de app de streaming

## 🗂️ Estrutura

```
.
├── index.html            # página única (hero + busca + catálogo + modal)
├── sitefinal.css         # visual estilo streaming
├── js/
│   ├── config.js         # chave da API do TMDB
│   ├── recomendacoes.js  # recomendações no TMDB (filme ou série)
│   └── app.js            # prateleiras, abas e modal (dados do TMDB)
└── logo.png
```

## ▶️ Como rodar

O catálogo, as recomendações e as imagens vêm todos do TMDB, então é preciso internet. Sirva com um servidor local:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## 🔑 Chave do TMDB

A chave fica em [`js/config.js`](./js/config.js). Para gerar/trocar a sua, acesse
[themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) e cole a **API Key (v3 auth)**:

```js
window.TMDB_CONFIG = {
  API_KEY: "sua-chave-aqui",
  LANG: "pt-BR"
};
```

> Como o site é estático, a chave fica visível no código. A do TMDB é de baixo risco (só leitura, gratuita); se precisar, revogue e gere outra a qualquer momento.

---

Projeto de estudo de desenvolvimento web. Usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.
