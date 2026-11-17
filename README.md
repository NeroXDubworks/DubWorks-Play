# DubWorks Play 💙

Catálogo independente da comunidade DubWorks, com identidade visual própria, login Google obrigatório para reproduzir vídeos, áreas de projetos e reprodução de episódios autorizados via Google Drive.

**Site:** https://dubworks-play.vercel.app/

## Estrutura do sistema

- **DubWorks Play:** site estático publicado pela Vercel, a partir deste repositório.
- **Supabase DubWorks Play:** autenticação Google, permissões, catálogo editorial, temporadas, episódios, favoritos e outros dados dos espectadores.
- **Google Drive:** armazena os arquivos de vídeo; o site utiliza o player incorporado do Google Drive.
- **DubWorks Manager:** permanece separado. O Play não altera seu banco de dados.

## Painel Administrativo DubWorks Play

O **Painel Administrativo** é acessado pelo botão **◈ Painel administrativo** no menu do perfil, após login Google com uma conta autorizada.

- **Visão geral:** indicadores reais de séries, episódios publicados, comentários pendentes e quantidade de usuários (para a Diretoria). Não inventa visualizações ou tempo assistido do Drive.
- **Séries e projetos:** criação e edição de títulos, sinopse, gênero, classificação indicativa, ano, capa, banner e status (rascunho, publicado ou arquivado). Séries novas publicadas passam a aparecer no catálogo sem alteração manual de código; séries em rascunho e arquivadas ficam ocultas.
- **Temporadas e episódios:** cadastro e publicação de temporadas, acesso ao editor já existente do Drive, correção de episódios e retirada do ar (retorno a rascunho).
- **Moderação:** aprovação e rejeição de comentários associados aos episódios.
- **Usuários e cargos:** apenas a Diretoria visualiza a relação de espectadores cadastrados e altera a permissão de outros perfis. Uma pessoa não pode promover a própria conta.
- **Configurações:** links para os painéis oficiais de Supabase, Drive e Vercel. Não são configurações fictícias.

### Segurança e permissões

As permissões são persistidas em `app_private.user_roles`, fora da API pública. A interface é limitada por cargo, e as políticas RLS do Supabase verificam qualquer gravação. As alterações de cargos usam a função `public.dw_admin_set_role` com `SECURITY INVOKER`, validação da Diretoria, bloqueio da alteração do próprio cargo e acesso seguro à tabela privada.

- **Diretoria:** catálogo, episódios, comentários, pessoas e cargos.
- **Administração:** catálogo, episódios e comentários, mas não modifica usuários.
- **Moderação:** moderação de comentários e painel informativo.
- **Espectador:** nunca acessa o painel.

Os e-mails vinculados às contas ficam visíveis somente ao próprio usuário e à Diretoria, conforme RLS.

## Pacote de funções da comunidade (novembro de 2026)

A integração do DubWorks Play inclui:

- **Página inicial administrável:** menu **Painel administrativo → Página inicial**, com três destaques, fileiras personalizadas, ordem, visibilidade e seleção de projetos. Configurações salvas em `home_layout` e aplicadas à página inicial sem alterar código.
- **Créditos e elenco:** cadastre nome de exibição, personagem, função, ordem e visibilidade em **Painel → Elenco e créditos**. Os créditos públicos aparecem na aba **Elenco** do projeto e na página do episódio.
- **Denúncias:** usuários com Google podem denunciar comentários aprovados. As denúncias ficam privadas na tabela `comment_reports` e aparecem para Diretoria, Administração e Moderadores em **Painel → Denúncias**.
- **Auditoria:** alterações de séries, temporadas, episódios, créditos, página inicial, moderação e cargos geram registros em `audit_events`. Os registros começam a contar a partir da implantação. Não armazenamos o conteúdo integral dos comentários nem chaves do Drive na auditoria.
- **Curtidas e histórico:** os espectadores logados podem curtir, marcar como assistido e abrir **Histórico de episódios** no menu do perfil. Curtidas ficam em `episode_likes` e são expostas ao público apenas em contagens agregadas na tabela `episode_like_counts`. O histórico individual fica em `watch_progress` com RLS.
- **Estatísticas optativas:** a plataforma pede permissão antes de registrar eventos anônimos de navegação em `site_events`. O painel mostra eventos dos últimos 30 dias e a quantidade total de curtidas. Não são métricas de espectadores únicos, nem minutos efetivamente vistos no Drive.
- **Política de privacidade e termos de uso:** páginas públicas `privacy.html` e `terms.html`, disponíveis no rodapé. A pessoa pode alterar a preferência de estatísticas a qualquer momento em **Preferências de privacidade**.

### Regras de divulgação

A interação com o Google é opcional. O perfil do espectador nunca concede acesso ao Drive administrativo. Para vídeos do Google Drive, **não há como saber automaticamente o minuto assistido ou o término**, por isso a conclusão é uma marcação manual. Para vídeos HTML5 externos compatíveis, o tempo pode ser atualizado na conta. O evento de finalização de vídeo HTML5 também abre a tela de recomendações.

As páginas de Termos e Privacidade são versões iniciais operacionais. **Solicite revisão jurídica antes de divulgação ampla**, sobretudo quanto a direitos autorais e obrigações da LGPD.

## Publicar episódio usando o Google Drive

1. Finalize e exporte o episódio em um formato aceito pelo Google Drive, como MP4.
2. Faça upload do vídeo **no seu Google Drive**.
3. Com as autorizações dos titulares confirmadas, abra o compartilhamento do arquivo e escolha **Qualquer pessoa com o link → Leitor** para permitir que usuários autenticados na plataforma assistam pelo player. O Google Drive ainda exige essa permissão de compartilhamento para incorporar o vídeo.
4. Copie o link do próprio **arquivo**, normalmente `https://drive.google.com/file/d/ID_DO_VIDEO/view?usp=sharing`. Não use um link de pasta.
5. Acesse o DubWorks Play e faça login com uma conta da **Diretoria** ou **Administração**.
6. Clique no perfil e escolha **◈ Painel administrativo → Temporadas e episódios → ＋ Publicar pelo Drive**. Há também um atalho **＋ Publicar episódio pelo Drive** no perfil.
7. Selecione a série, informe **temporada**, **episódio**, **título**, descrição e miniatura (opcionais) e cole o link.
8. Se ainda não estiver pronto para o público, clique em **Salvar rascunho**. Para publicar, marque a declaração de autorização e clique em **Salvar e publicar**.

Se esse episódio já estiver cadastrado, o painel carrega seus dados e salva as alterações no mesmo registro. O formulário não faz upload direto: **você envia o vídeo pelo próprio Drive e cola o link no site**.

### Como funciona a reprodução

Um vídeo publicado aparece no catálogo para qualquer visitante, mas **a reprodução exige login Google no DubWorks Play**. Sem login, a página do episódio mostra um convite para autenticação em vez do player. O link do Drive é convertido para um endereço seguro no formato `https://drive.google.com/file/d/ID_DO_VIDEO/preview`, apresentado por `iframe`. Os links antigos com `resourcekey` também são reconhecidos.

O player na tela do episódio utiliza os **controles do Google Drive**, não um elemento HTML5 `video`. Portanto, o DubWorks Play **não controla a velocidade, a posição do vídeo nem consegue sincronizar automaticamente o tempo assistido** de arquivos do Drive. A funcionalidade de continuar assistindo na posição exata continua disponível apenas para vídeos hospedados compatíveis com HTML5.

**O sistema não verifica automaticamente se o Google Drive liberou a visualização.** Após publicar, teste o link em uma janela anônima, como visitante, antes de divulgar. Arquivos restritos, com bloqueios ou que excedam limites de reprodução do Drive podem não tocar.

**Atalhos externos:** a interface pública não mostra mais o botão “Abrir no Drive”. O canto do iframe que exibe o atalho externo é coberto visualmente, e o iframe usa `sandbox` sem permissão para popups ou navegação da página principal. A visualização em tela cheia utiliza o contêiner do DubWorks Play. Essas medidas melhoram a navegação, mas podem afetar recursos do player do Google e **não impedem que um visitante encontre o ID ou link público do vídeo pelas ferramentas do navegador**. Portanto, não são medidas de proteção de conteúdo, privacidade ou DRM. Teste o vídeo em uma janela anônima no computador e no celular após publicar.

**Download offline não está implementado.** O Google Drive pode mostrar opções próprias de download conforme o compartilhamento, e o DubWorks Play não tem controle completo sobre esses botões.

### Comentários e moderação

- Na **página do episódio**, abaixo da lista de próximos episódios, há o campo **Comentários**.
- Visitantes podem ler somente comentários aprovados.
- Para comentar, o espectador faz login com Google. Os comentários entram no banco com status `pending` e aguardam moderação antes de serem exibidos para todos.
- A Diretoria, Administradores e Moderadores podem aprovar/rejeitar comentários pendentes diretamente naquela página.
- Quem escreveu pode excluir o próprio comentário.
- Por enquanto, comentários de outras pessoas aparecem com o identificador genérico **Comunidade DubWorks**, sem expor automaticamente o nome real do Google. O próprio espectador vê **Você** no seu comentário.

### Editar episódio e classificação indicativa

Após fazer login com uma conta da Diretoria ou Administração:

1. Na página de uma série, clique em **Editar classificação e ano** para abrir o painel editorial na série correta. Escolha a classificação indicativa confirmada (Livre, 10, 12, 14, 16, 18 anos), preencha o ano se souber e clique em **Salvar classificação e ano**.
2. Para alterar um episódio já cadastrado, clique em **Editar episódio** na lista de episódios ou na tela de reprodução. O formulário abre com série, temporada, número, título, descrição, duração e link do Drive existentes.
3. Use **Salvar rascunho** se desejar retirar da exibição pública ou **Salvar e publicar** após conferir os direitos e o link.

Não há classificação inventada: séries que não têm o campo preenchido mostram **Não classificado** até a equipe informar o dado correto.

### Recomendações ao terminar

Ao final de um vídeo hospedado diretamente com o player HTML5, aparece **automaticamente** uma tela escurecida de sugestões com cards de episódios disponíveis e projetos semelhantes. Os títulos têm animações de levantamento ao passar o mouse e ao tocar no celular.

**Google Drive:** o iframe de pré-visualização não oferece um evento de término acessível ao site. Por isso, na reprodução via Drive, há o botão **Terminei • Ver sugestões**. Ao usá-lo, o iframe é interrompido, aparece a tela de recomendações e o espectador pode escolher outro episódio ou série. Voltar ao vídeo recarrega o player do Drive, sem restaurar automaticamente o segundo anterior.

### Segurança

- Entrar com Google é **obrigatório para reproduzir vídeos**. Visitar o catálogo e ler os títulos continua permitido sem login.
- As permissões para publicar são verificadas no banco Supabase com **Row Level Security (RLS)**: Diretoria e Administração podem editar; espectadores não podem publicar, mesmo manipulando o HTML.
- O site usa apenas uma chave pública `sb_publishable_` no navegador; nenhum segredo Google, token de Drive ou chave administrativa deve ser inserido no código público.
- O vídeo só fica liberado no registro do catálogo quando há link de mídia e confirmação explícita dos direitos de publicação.
- O login Google dos espectadores **não concede acesso ao Drive pessoal de ninguém**. O banco não entrega as colunas de links de vídeo para o papel anônimo; após autenticar, o site carrega o endereço do arquivo. Isso não é DRM: arquivos do Drive compartilhados com qualquer pessoa com o link ainda podem ser encontrados e acessados fora da plataforma, caso alguém obtenha o endereço.

## Recursos do catálogo

- Página inicial com destaques e categorias, busca, cards animados e efeitos para toque.
- Página individual de cada projeto com banner editorial e lista de episódios. O player aparece somente após selecionar o episódio.
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
