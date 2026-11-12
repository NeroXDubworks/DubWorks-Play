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
- Página de cada projeto, com abas de episódios, sugestões, extras e detalhes.
- **Seletor de temporadas:** episódios podem ter um campo `season` e são agrupados na sua temporada.
- **Player HTML5:** tela dedicada, controles nativos (play, pausa, áudio, busca e tela cheia), mudança de velocidade, mini player quando disponível, anterior/próximo episódio.
- **Continuar assistindo:** guarda o ponto do vídeo no navegador (`localStorage`), sem login.
- Para episódios ainda não publicados, mostra estado “Indisponível”, sem simular um vídeo real.
- Aparência dark azul no estilo escolhido para o DubWorks Play.

## Dados

O protótipo usa uma **lista estática** de alguns projetos reais do DubWorks Manager (consultados em 11/11/2026). Não acessa ou altera o banco de produção. O status de edição/produção **não significa que o episódio esteja disponível para assistir**. Os cartões usam links de capas existentes no cadastro; imagens hospedadas em sites externos podem deixar de funcionar.

### Como vincular um episódio autorizado ao player

Na lista `projects` em `app.js`, um episódio pode incluir os seguintes campos:

```js
{
  season: 1,                    // número da temporada no catálogo
  number: 1,                    // episódio dentro da temporada
  name: 'Nome do episódio',
  status: 'Publicado',
  published: true,              // é necessário marcar explicitamente
  videoUrl: 'https://exemplo.com/video-autorizado.mp4',
  // opcionais:
  posterUrl: 'https://exemplo.com/capa-autorizada.jpg',
  captionsUrl: 'https://exemplo.com/legendas-ptbr.vtt'
}
```

O player só habilita o vídeo quando `published: true` **e** um endereço HTTPS de mídia são informados. A URL precisa apontar para um arquivo/formato reproduzível pelo navegador, por exemplo MP4 compatível. Plataformas que exigem autenticação, URLs do Google Drive ou formatos HLS podem precisar de um provedor/player específico. O servidor do vídeo precisa permitir o acesso no navegador.

Os episódios antigos sem `season` são agrupados **provisoriamente** em “Temporada 1”; isso não confirma a numeração oficial das temporadas. Projetos sem episódios não exibem temporadas fictícias. A seleção de temporadas ainda é estática, sem painel de edição.

**Não existe download offline implementado nesta versão.** Ativá-lo exigirá autorização específica, infraestrutura de arquivos e política de acesso.

### Próximas fases

- Painel editorial para cadastrar filmes, séries, temporadas e episódios autorizados.
- Integração com um serviço apropriado de hospedagem e entrega de vídeo, após verificação dos direitos de distribuição.
- Sincronização somente leitura e restrita com os projetos relevantes do DubWorks Manager, usando uma API segura.
- Autenticação e controle de permissões.
- Capas e artes oficiais produzidas/licenciadas para o catálogo.

## Direitos de uso

A participação em uma fandublagem não equivale a autorização de distribuição da obra audiovisual original. Não publique episódios completos nem incorpore vídeos, trilhas ou imagens de terceiros sem verificar os direitos pertinentes.

**Este repositório é totalmente separado do `Dubworks-Manager`.**
