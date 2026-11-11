# DubWorks Play 💙

Protótipo navegável de um **catálogo de fandublagens**, inspirado na navegação de plataformas de streaming, mas com identidade própria da DubWorks.

## Como executar

É um site estático, sem instalação de dependências:

1. Abra `index.html` no navegador; ou
2. Execute `python -m http.server 8000` dentro desta pasta e acesse `http://localhost:8000`.

Pode ser hospedado na Vercel (framework **Other**, build command vazio, output directory `.`) ou no GitHub Pages.

## O que já funciona

- Página inicial com banner alternável e categorias.
- Catálogo responsivo para computador e celular.
- Busca de projetos, filtros por estágio, e listas de animes e desenhos.
- Favoritos salvos no navegador (`localStorage`).
- Janela de detalhes com episódios já cadastrados, quando disponíveis.
- Aparência dark azul no estilo escolhido para o DubWorks Play.

## Dados

O protótipo usa uma **lista estática** de alguns projetos reais do DubWorks Manager (consultados em 11/11/2026). Não acessa ou altera o banco de produção. O status de edição/produção **não significa que o episódio esteja disponível para assistir**. Os cartões usam links de capas existentes no cadastro; imagens hospedadas em sites externos podem deixar de funcionar.

### Próximas fases

- Painel editorial para cadastrar filmes, séries, temporadas e episódios publicados.
- Player com vídeos armazenados ou hospedados com autorização, com controles e acompanhamento de progresso.
- Sincronização somente leitura e restrita com os projetos relevantes do DubWorks Manager, usando uma API segura.
- Autenticação e controle de permissões.
- Capas e artes oficiais produzidas/licenciadas para o catálogo.

## Direitos de uso

A participação em uma fandublagem não equivale a autorização de distribuição da obra audiovisual original. Não publique episódios completos nem incorpore vídeos, trilhas ou imagens de terceiros sem verificar os direitos pertinentes.

**Este repositório é totalmente separado do `Dubworks-Manager`.**
