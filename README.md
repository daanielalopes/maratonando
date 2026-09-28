# CINE·SÉRIES 🎬🍿

Site de recomendação de séries com visual de aplicativo de streaming. Você informa a última série que assistiu e recebe sugestões parecidas — além de navegar por prateleiras de séries organizadas por gênero, com pôster, sinopse e trailer.

## ✨ Funcionalidades

- 🍿 **Hero** com clima de cinema e busca em destaque
- 🤖 **Recomendações** baseadas na última série assistida, via API do [TMDB](https://www.themoviedb.org/)
- 🎞️ **Prateleiras por gênero** (ação, drama, comédia, terror) com pôsteres em carrossel
- 🔎 **Modal** com sinopse e trailer ao clicar em qualquer série
- 🌙 Tema escuro cinematográfico, responsivo

## 🗂️ Estrutura

```
.
├── index.html            # página única (hero + prateleiras + modal)
├── sitefinal.css         # visual estilo streaming
├── js/
│   ├── config.js         # chave da API do TMDB
│   ├── series-data.js    # catálogo local (séries por gênero)
│   ├── recomendacoes.js  # busca de recomendações no TMDB
│   └── app.js            # prateleiras e modal
├── img/                  # pôsteres das séries, por gênero
└── logo.png
```

## ▶️ Como rodar

O recomendador precisa de internet (fala com o TMDB). Sirva com um servidor local:

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
