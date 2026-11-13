# DubWorks Play 💙

Catálogo independente da comunidade DubWorks, com identidade visual própria, login Google opcional, áreas de projetos e reprodução de episódios autorizados via Google Drive.

**Site:** https://dubworks-play.vercel.app/

## Estrutura do sistema

- **DubWorks Play:** site estático publicado pela Vercel, a partir deste repositório.
- **Supabase DubWorks Play:** autenticação Google, permissões, catálogo editorial, temporadas, episódios, favoritos e outros dados dos espectadores.
- **Google Drive:** armazena os arquivos de vídeo; o site utiliza o player incorporado do Google Drive.
- **DubWorks Manager:** permanece separado. O Play não altera seu banco de dados.

## Publicar episódio usando o Google Drive

1. Finalize e exporte o episódio em um formato aceito pelo Google Drive, como MP4.
2. Faça upload do vídeo **no seu Google Drive**.
3. Com as autorizações dos titulares confirmadas, abra o compartilhamento do arquivo e escolha **Qualquer pessoa com o link → Leitor** para permitir reprodução por visitantes sem login.
4. Copie o link do próprio **arquivo**, normalmente `https://drive.google.com/file/d/ID_DO_VIDEO/view?usp=sharing`. Não use um link de pasta.
5. Acesse o DubWorks Play e faça login com uma conta da **Diretoria** ou **Administração**.
6. Clique no perfil, no canto superior direito, e escolha **✦ Publicar episódio do Drive**.
7. Selecione a série, informe **temporada**, **episódio**, **título**, descrição e miniatura (opcionais) e cole o link.
8. Se ainda não estiver pronto para o público, clique em **Salvar rascunho**. Para publicar, marque a declaração de autorização e clique em **Salvar e publicar**.

Se esse episódio já estiver cadastrado, o painel carrega seus dados e salva as alterações no mesmo registro. O formulário não faz upload direto: **você envia o vídeo pelo próprio Drive e cola o link no site**.

### Como funciona a reprodução

Um vídeo publicado aparece no catálogo e pode ser aberto sem login. O link do Drive é convertido para um endereço seguro no formato `https://drive.google.com/file/d/ID_DO_VIDEO/preview`, apresentado por `iframe`. Os links antigos com `resourcekey` também são reconhecidos.

O player da página do projeto e a tela completa do episódio utilizam os **controles do Google Drive**, não um elemento HTML5 `video`. Portanto, o DubWorks Play **não controla a velocidade, a posição do vídeo nem consegue sincronizar automaticamente o tempo assistido** de arquivos do Drive. A funcionalidade de continuar assistindo na posição exata continua disponível apenas para vídeos hospedados compatíveis com HTML5.

**O sistema não verifica automaticamente se o Google Drive liberou a visualização.** Após publicar, teste o link em uma janela anônima, como visitante, antes de divulgar. Arquivos restritos, com bloqueios ou que excedam limites de reprodução do Drive podem não tocar.

**Download offline não está implementado.** O Google Drive pode mostrar opções próprias de download conforme o compartilhamento, e o DubWorks Play não tem controle completo sobre esses botões.

### Segurança

- Entrar com Google é **opcional** para assistir.
- As permissões para publicar são verificadas no banco Supabase com **Row Level Security (RLS)**: Diretoria e Administração podem editar; espectadores não podem publicar, mesmo manipulando o HTML.
- O site usa apenas uma chave pública `sb_publishable_` no navegador; nenhum segredo Google, token de Drive ou chave administrativa deve ser inserido no código público.
- O vídeo só fica liberado no registro do catálogo quando há link de mídia e confirmação explícita dos direitos de publicação.
- O login Google dos espectadores **não concede acesso ao Drive pessoal de ninguém**.

## Recursos do catálogo

- Página inicial com destaques e categorias, busca, cards animados e efeitos para toque.
- Páginas individuais de projetos com player incorporado, temporadas, episódios, sugestões, extras e detalhes.
- Reprodução por Google Drive quando o episódio estiver publicado, e tela de indisponibilidade para episódios ainda não liberados.
- Player HTML5 alternativo para vídeos hospedados em formato compatível.
- Favoritos no navegador para visitantes e sincronização de Minha Lista para espectadores logados.
- Diferenciação entre espectadores, moderadores, administradores e diretoria.

A estrutura visual inicial ainda contém dados de alguns projetos da comunidade. Só os episódios expressamente publicados no banco próprio do Play são liberados para reprodução. **A condição “episódio finalizado” no Manager não publica um vídeo automaticamente.**

## Desenvolvimento

Site estático sem etapa de compilação. Para execução local:

```bash
python -m http.server 8000
```

Abra `http://localhost:8000`. Na Vercel: framework **Other**, output directory `.`, sem build command. O Google OAuth requer que a URL de retorno esteja cadastrada no Supabase.

## Direitos de uso

Fazer uma fandublagem **não concede automaticamente** autorização para distribuir o episódio audiovisual original. É necessário verificar as licenças e autorizações pertinentes antes de compartilhar um episódio completo ou disponibilizar downloads.

Este repositório é totalmente separado do **DubWorks Manager**.
