# Brief das abas: Jogador, Carreira, Títulos, Santos e Loja

Este arquivo guarda o pedido do dono do site, como ele escreveu (seções 1 a 10), e as regras técnicas
que valem para todas as páginas internas (seção 0).

O pedido vem com uma exigência central: **todas as abas precisam ter o mesmo nível de animação da página
principal (index.html)**.

## 0. Regras técnicas do projeto (valem para todas as abas)

### Servidor e estrutura

- O site é estático e é servido com `python -m http.server 8080` a partir de `C:\Users\caiqu\Site-Neymar`.
  - Endereço local: http://localhost:8080.
  - Não há build: só HTML, CSS e módulos JS.
- Cada aba fica numa pasta própria: `/jogador/`, `/carreira/`, `/titulos/`, `/santos/`, `/loja/`.
  - Arquivos da página: `index.html`, `<aba>.css`, `<aba>.js` (módulo), dados em `.json` e imagens em `assets/`.
  - Use caminhos absolutos para o que é compartilhado: `/shared/...` e `/assets/...`.

### O que já existe e deve ser reaproveitado

- `/shared/njr.css` traz os tokens, as fontes, o cabeçalho, a placa de transição e os estados de `[data-reveal]`.
- `/shared/njr.js` é o motor compartilhado. É o mesmo motor da home: laço rAF, `Spring`, `motion`, `splitText`,
  `buildHeading`, `inView`, `forward`, `scrub`, `countUp`, `revealAll`, `depth`, `initPage`, `leaveTo`.
  - Leia os dois arquivos inteiros antes de começar.
  - **Não edite nada em /shared/.** Se precisar de algo novo, implemente na própria página e registre no relatório final.

### Linguagem de animação

- A linguagem é a da home (`/index.html`), um arquivo grande com CSS e JS inline. Estude:
  - os textos que entram palavra a palavra com mola (`splitText`, `buildHeading` com ponto amarelo);
  - as placas `motion()`;
  - as seções com sticky e scrub;
  - os contadores, as linhas que crescem (`scaleX`) e o hover amarelo.
- Tipografia: Oswald 700 em maiúsculas para display e Space Grotesk para texto.
- Cores: fundo gelo `#f7fafb` ou tinta `#090a0b`, amarelo `#fedd00` como destaque, verde `#009c3b` com moderação.
- O Vestiário (`/vestiario/`) é a referência de acabamento. **Não altere nada em `/vestiario/` nem em `/index.html`.**

### Modelo obrigatório de cada página

```html
<!doctype html>
<html lang="pt-BR" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Carreira · Neymar Jr</title>
<meta name="description" content="...">
<link rel="icon" href="/assets/ui/njr-logo.png">
<script>try{if(sessionStorage.getItem("njr-plate"))document.documentElement.classList.add("njr-arriving")}catch(e){}</script>
<link rel="stylesheet" href="/shared/njr.css">
<link rel="stylesheet" href="carreira.css">
</head>
<body>
<div class="njr-plate" aria-hidden="true"><i></i><b></b></div>
<main> ... </main>
<script type="module" src="carreira.js"></script>
</body>
</html>
```

- No JS da página, faça `const { header } = await initPage("/carreira/", { onDark, credits, heroImage })` e só
  depois comece a entrada própria da página.
- `initPage` já monta o cabeçalho, o rodapé (link "Próximo" e créditos), o Lenis, os links com placa e a saída da placa.
  - Para revelações simples, use `revealAll()`.
  - Use `scrub()` para animações ligadas à rolagem.
  - Use `depth()` para o parallax no mouse.

### Restrições de bibliotecas e desempenho

- Não adicione bibliotecas. GSAP, React, Three.js e afins estão fora.
  - O Lenis já é carregado pelo `initPage`.
  - Web Animations API e CSS são livres.
- Desempenho:
  - Anime só `transform`, `opacity`, `clip-path` e `filter` com moderação.
  - Cada imagem com no máximo ~1600 px de largura, em `.webp` com qualidade ~80 (em geral menos de 250 KB).
  - Use `loading="lazy"` fora da primeira dobra.
  - Pare os laços de animação fora da tela (`inView` ou `scrub` já fazem isso).
- Mantenha as dimensões das imagens fixas (CLS zero).

### Acessibilidade e responsividade

- `prefers-reduced-motion` precisa funcionar. `REDUCED` já zera as molas, e os conteúdos devem aparecer completos.
- Tudo deve funcionar por teclado, com foco visível, e por toque. Teste no celular a 375 px.
- Não trave a rolagem sem necessidade.
- O conteúdo precisa continuar acessível se o JS falhar. A classe `no-js` existe para isso.

### Dados

- Verifique os dados com fontes reais usando WebSearch e WebFetch: Wikipedia (pt e en), sites oficiais de clubes,
  FIFA, CBF, ESPN, ge.globo, Transfermarkt, ogol.
- Hoje é **22/10/2026**.
- `vestiario/capitulos.json` já tem dados verificados de cada capítulo: números, conquistas, momentos e fontes.
  - Use esses dados como base e mantenha consistência com eles.
  - Se encontrar divergência, não altere o arquivo. Registre a divergência no relatório.
- Toda estatística precisa de fonte e de período ("até tal data"). Em caso de dúvida, omita.
- Nunca invente.

### Imagens

- Use só imagens com licença adequada, de preferência do Wikimedia Commons (CC BY, CC BY-SA, CC0, domínio público).
  - Busca pela API: `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&...&prop=imageinfo&iiprop=url|size|extmetadata`.
  - Baixe com `curl -A "NJRsite/1.0 (fan site)"`.
  - Converta para webp com Python e PIL.
- Guarde o crédito de cada imagem no JSON da página (autor, licença, link do arquivo) e mostre na página.
- Pode reaproveitar:
  - `vestiario/assets/historia/*.webp`, com créditos em `vestiario/capitulos.json` (campo `fotos`);
  - `assets/timeline/*.webp`, `assets/paddock/portrait.webp`, `assets/hero/*`, `assets/footer/neymar.webp`.
- Não remova marca d'água. Não use imagens de bancos pagos.

### Testes

Existe Chrome headless com GPU e puppeteer-core. Copie o cabeçalho de
`C:\Users\caiqu\AppData\Local\Temp\claude\C--Users-caiqu-Site-Neymar\bcc816ca-9e22-4ed4-a274-e2641a2b35a4\scratchpad\shoot.mjs`
(import do puppeteer e caminho do executável) para um script seu, salvo na pasta `_testes/` da sua aba.

O script deve:
- abrir a página em 1440x900 e em 375x812;
- rolar a página;
- clicar nos controles;
- coletar `pageerror` e `console.error`;
- salvar screenshots.

Cuidados com a máquina, que tem pouca RAM livre porque um render do Blender está rodando:
- **Abra no máximo um navegador por vez e sempre feche-o.**
- **Nunca encerre processos do `blender.exe`** nem o servidor Python.

### Relatório final

Responda com:
- os arquivos criados;
- as funcionalidades concluídas;
- os testes executados, com os resultados;
- os dados ou imagens que ainda precisam de validação;
- os pontos pendentes.

---

## Pedido do dono do site (texto original)

# EVOLUÇÃO DO SITE NEYMAR JR — IMPLEMENTAR AS ABAS RESTANTES

O Vestiário já está implementado. Agora quero transformar as outras opções da navegação principal em experiências interativas, surpreendentes e visualmente sofisticadas.

As abas são: JOGADOR, CARREIRA, TÍTULOS, SANTOS, LOJA.

Você já conhece o projeto, o código, o site de referência e o histórico desta conversa. Não reconstrua o site e não refaça o Vestiário. Trabalhe diretamente sobre a implementação existente, preservando tudo o que já funciona.

**OBJETIVO:** fazer cada aba ter uma identidade própria, com funcionalidades reais, animações cinematográficas, interações memoráveis e acabamento profissional, mantendo a coerência com o site original e com o Vestiário que já foi desenvolvido.

Não quero simplesmente cinco páginas com textos, imagens e cards. Quero cinco experiências que pareçam partes de um mesmo produto digital premium.

## 1. DIRETRIZES GERAIS

Antes de começar, considere a implementação atual do Vestiário como referência de qualidade e consistência.

- Preserve a identidade visual, tipografia, cores, fundos, linhas gráficas, espaçamentos e linguagem de animação do projeto.
- Reutilize os componentes, transições e recursos existentes quando fizer sentido.
- Mantenha a navegação principal visível e funcional.
- Cada item deve abrir sua experiência correspondente, sem links vazios ou botões decorativos.
- Crie uma personalidade visual específica para cada seção, sem fazer todas parecerem iguais.
- Utilize animações de entrada e saída, revelação de imagens, tipografia animada, transições entre cenas e microinterações.
- Prefira animações fluidas, intencionais e bem sincronizadas a efeitos exagerados.
- Não introduza bibliotecas desnecessárias se o projeto já possui recursos suficientes.
- Evite problemas de desempenho, especialmente em dispositivos móveis.
- Respeite a preferência do sistema por redução de movimento.
- Utilize imagens legítimas, com qualidade elevada e enquadramento coerente.
- Não invente estatísticas, títulos, datas ou acontecimentos da carreira do Neymar.

Quero que você implemente as funcionalidades, não apenas apresente um plano ou uma proposta visual.

## 2. JOGADOR — O PROTAGONISTA

### Conceito

Transformar a apresentação de Neymar em um retrato digital interativo, sofisticado e cinematográfico. Esta seção deve aprofundar a apresentação do jogador que aparece na página inicial.

### Experiência visual

- Comece com uma transição elegante a partir da página atual.
- Apresente um retrato de Neymar em grande escala, com composição editorial e bastante espaço negativo.
- Utilize profundidade entre o retrato e o fundo, com parallax sutil controlado pelo movimento do mouse.
- Anime o nome NEYMAR JR com uma entrada tipográfica marcante.
- Revele informações progressivamente durante a rolagem.
- Utilize linhas, marcadores, números e elementos gráficos que remetam à análise de desempenho esportivo.
- Evite uma aparência de dashboard estatístico convencional.

### Conteúdo e funcionalidades

Organize a seção em blocos interativos:

**A. Perfil**
- Nome e identificação do jogador.
- Data de nascimento e nacionalidade.
- Posição e características técnicas.
- Pé dominante, quando confirmado.
- Clubes e trajetória internacional.

**B. Números da carreira**
- Partidas e gols por clube.
- Estatísticas pela Seleção Brasileira.
- Assistências e outras métricas quando houver fontes confiáveis.
- Separação clara entre estatísticas de clubes e da Seleção.
- Contextualização das competições e dos períodos considerados.

Apresente os números com animações tipográficas, contadores discretos e transições suaves. Não utilize números inventados ou estatísticas sem uma fonte identificável.

**C. Estilo de jogo**
Crie uma apresentação visual das principais características do jogador, como drible, criatividade, velocidade, finalização e criação de oportunidades.

Utilize pequenas cenas, imagens ou ilustrações acompanhadas de textos curtos. Não transforme essas características em notas numéricas arbitrárias.

**D. Momentos marcantes**
Apresente uma seleção de momentos importantes, com imagem, data, contexto e fonte. Permita explorar os detalhes sem abandonar a identidade visual da página.

### Momento de destaque

Ao movimentar o mouse, o retrato deve apresentar uma sensação de profundidade e os elementos gráficos devem reagir sutilmente. Conforme o visitante rola a página, a apresentação evolui do retrato para o perfil, depois para os números e os momentos marcantes.

O resultado deve parecer uma matéria editorial interativa, não uma ficha de atleta.

## 3. CARREIRA — A TRAJETÓRIA CINEMATOGRÁFICA

### Conceito

Criar uma linha do tempo interativa que permita percorrer a carreira de Neymar como se o visitante estivesse avançando por diferentes capítulos de um filme.

Esta seção deve ter uma identidade própria e não ser apenas uma cópia do Vestiário. O Vestiário explora os uniformes; Carreira conta a história da trajetória.

### Estrutura narrativa

Organize os capítulos principais:

1. Santos — primeira passagem, 2009–2013.
2. Barcelona — 2013–2017.
3. Paris Saint-Germain — 2017–2023.
4. Al-Hilal — 2023–2025.
5. Santos — retorno em 2025.
6. Seleção Brasileira — trajetória internacional, tratada como linha narrativa independente.

Verifique as datas e os acontecimentos antes de publicar.

### Funcionamento da linha do tempo

- Utilize uma linha gráfica contínua que conecte os capítulos.
- Permita navegar por rolagem, setas e seleção direta dos períodos.
- Ao entrar em cada capítulo, altere a composição visual, o título, as imagens e a narrativa.
- Revele fotografias históricas por meio de máscaras, recortes e movimentos controlados.
- Apresente os principais acontecimentos em uma sequência temporal.
- Utilize datas, nomes e números como elementos de composição.
- Inclua uma indicação clara de onde o visitante está na trajetória.
- Permita avançar e retroceder sem recarregar toda a página.

### Transições

Quero que a passagem entre épocas seja especialmente bem executada.

Por exemplo, ao sair do Santos e entrar no Barcelona, a fotografia pode se deslocar para revelar outra imagem, enquanto o ano muda e o novo capítulo aparece com uma animação tipográfica.

Explore movimentos horizontais, parallax, mudanças de escala, máscaras e transições de cenário. Não use sempre o mesmo efeito para todos os capítulos.

A rolagem pode controlar a narrativa, mas não deve prender o visitante em uma animação longa ou impedir a navegação normal. No celular, ofereça uma versão vertical e controles acessíveis.

### Conteúdo

Cada capítulo deve conter:
- Período.
- Clube ou Seleção.
- Contexto da chegada.
- Principais acontecimentos.
- Conquistas relevantes.
- Estatísticas verificadas.
- Imagens históricas e créditos.

Inclua a primeira passagem e o retorno ao Santos como capítulos separados. A Seleção Brasileira deve ser apresentada independentemente dos clubes.

### Momento de destaque

A experiência deve transmitir a sensação de atravessar diferentes épocas da carreira. Cada capítulo precisa ter seu próprio ritmo visual, mas compartilhar a mesma linguagem de animação.

## 4. TÍTULOS — A SALA DAS CONQUISTAS

### Conceito

Transformar os títulos e as conquistas de Neymar em uma galeria digital premium.

Não quero uma lista simples de troféus ou uma grade convencional de cards. Cada conquista importante deve ter uma apresentação visual própria.

### Experiência visual

- Crie um ambiente de exposição minimalista.
- Utilize um troféu ou uma imagem representativa em destaque.
- Se houver modelos 3D adequados, permita uma rotação sutil e controlada.
- Caso não existam modelos apropriados, utilize fotografias de alta qualidade e animações em camadas, sem criar objetos 3D falsos ou genéricos.
- Ao selecionar uma conquista, aproxime visualmente o elemento principal e revele as informações.
- Utilize iluminação, profundidade e movimento de câmera com moderação.
- Anime os anos e os nomes das competições.
- Inclua uma navegação por categorias.

### Categorias

Separe as conquistas em:

- Títulos por clubes.
- Conquistas pela Seleção Brasileira.
- Prêmios e reconhecimentos individuais.

Permita filtrar os resultados por clube, Seleção e categoria.

### Conteúdo de cada conquista

Quando confirmado, apresente:
- Nome da competição.
- Temporada ou ano.
- Clube ou Seleção.
- Contexto da conquista.
- Papel de Neymar naquela campanha, quando documentado.
- Imagem relacionada.
- Fonte e créditos.

Diferencie títulos coletivos de prêmios individuais. Não misture títulos oficiais, recordes, estatísticas e participações como se fossem equivalentes.

### Interatividade

- Selecionar uma conquista abre uma apresentação detalhada.
- O visitante pode navegar entre conquistas sem retornar ao início.
- Os filtros atualizam a galeria corretamente.
- O estado selecionado deve ser visualmente claro.
- A experiência deve funcionar com mouse, teclado e toque.

### Momento de destaque

Ao selecionar um troféu, a composição deve se reorganizar, o elemento principal ganha destaque e as informações entram em sequência. A transição precisa parecer uma exposição editorial interativa.

## 5. SANTOS — A HISTÓRIA COM O CLUBE

### Conceito

Criar uma experiência emocional dedicada à relação entre Neymar e o Santos Futebol Clube.

Esta seção não deve repetir a linha do tempo geral. Seu foco é contar a história específica dessa relação, desde a primeira passagem até o retorno.

### Abertura

Crie uma abertura visual inspirada na atmosfera de um estádio.

A composição pode começar com uma imagem da Vila Belmiro, detalhes arquitetônicos, iluminação e referências gráficas ao clube. Em seguida, a narrativa revela Neymar e introduz a primeira passagem.

A entrada deve ser marcante, mas preservar o minimalismo do projeto. Não crie uma simulação de estádio 3D pesada se uma composição visual bem construída alcançar resultado superior.

### Dois capítulos distintos

**A. A primeira passagem — 2009–2013**

Destaque:
- A ascensão de Neymar.
- A relação com o clube e a torcida.
- A conquista da Libertadores de 2011.
- Os momentos que o projetaram internacionalmente.
- O contexto da saída para o Barcelona.

**B. O retorno — a partir de 2025**

Destaque:
- O retorno ao clube onde começou a ganhar projeção.
- O contexto dessa decisão.
- Os acontecimentos relevantes dessa nova etapa.
- A relação com a torcida e o significado do retorno.

Atualize as informações sobre o período do retorno com fatos confirmados. Não presuma resultados futuros ou utilize notícias antigas como se fossem atuais.

### Funcionalidades

- Seletor entre primeira passagem e retorno.
- Linha do tempo própria do Santos.
- Galeria de fotografias históricas.
- Momentos importantes com contexto e fontes.
- Uniformes de diferentes épocas, integrados visualmente ao conceito do Vestiário quando apropriado.
- Estatísticas específicas das passagens, se confirmadas.
- Links para vídeos ou registros legítimos quando disponíveis.

### Momento de destaque

Quero uma transição que conecte visualmente o jovem Neymar da primeira passagem ao Neymar do retorno.

Essa passagem pode usar imagens alinhadas, máscaras, deslocamento e mudanças de escala para transmitir a passagem do tempo. Não precisa de efeitos exagerados: a força deve estar na composição e na narrativa.

A seção deve ser emocional, elegante e historicamente responsável.

## 6. LOJA — VITRINE INTERATIVA

### Conceito

Criar uma experiência de produtos integrada à estética do site. A loja deve parecer uma extensão da identidade visual, e não uma plataforma de e-commerce genérica.

Antes de implementar pagamentos ou integrações externas, verifique se o projeto já possui produtos, catálogo, backend ou infraestrutura comercial. Não invente produtos reais, preços, estoque ou disponibilidade.

### Experiência visual

- Produtos em destaque, com composição editorial.
- Fundo minimalista e iluminação que valorize as peças.
- Transições suaves entre produtos e categorias.
- Tipografia forte para nomes e preços.
- Filtros discretos e funcionais.
- Galeria de imagens de cada produto.
- Layout responsivo, com navegação adequada para celular.

### Funcionalidades

Implemente, de acordo com os recursos reais disponíveis:

- Categorias de produtos.
- Galeria de produtos.
- Página ou painel de detalhes.
- Seleção de tamanho e outras variantes existentes.
- Preço e disponibilidade reais.
- Galeria de imagens por produto.
- Carrinho funcional, se houver infraestrutura adequada.
- Confirmação visual ao adicionar um produto ao carrinho.
- Resumo do carrinho e possibilidade de remover itens.
- Navegação de retorno à galeria.

Se o projeto ainda não possui catálogo ou backend comercial, comece com uma vitrine demonstrativa claramente separada de uma loja pronta para vendas. Não simule pagamentos bem-sucedidos nem prometa estoque inexistente.

### Animações

Ao selecionar um produto:
- O item deve ganhar destaque visual.
- As informações devem aparecer com uma transição sincronizada.
- As imagens alternativas devem poder ser selecionadas.
- A escolha de tamanho deve atualizar o estado da interface.
- A adição ao carrinho deve ter feedback claro e elegante.

Se houver um modelo 3D legítimo do produto, considere permitir uma rotação controlada. Caso contrário, utilize imagens de produto de qualidade e uma composição editorial bem executada.

### Momento de destaque

A transição entre a galeria e o produto selecionado deve parecer uma mudança de foco da câmera. O produto ocupa o centro da composição e os detalhes aparecem de maneira organizada, sem perder a identidade do site.

Utilize somente produtos, uniformes, marcas e imagens que possam ser apresentados legitimamente.

## 7. SISTEMA COMPARTILHADO DE ANIMAÇÃO

Todas as abas devem utilizar uma linguagem visual coerente, sem parecer cópias umas das outras.

Crie ou reutilize um conjunto de padrões compartilhados para:
- Transições entre páginas.
- Entrada e saída de títulos.
- Revelação de imagens.
- Animações de números.
- Indicadores de navegação.
- Estados de carregamento.
- Microinterações.
- Feedback de seleção.
- Movimento de profundidade e parallax.
- Retorno à página inicial.

Aplique esses recursos conforme a personalidade de cada seção:

- JOGADOR: retrato, profundidade e dados individuais.
- CARREIRA: passagem do tempo e narrativa cronológica.
- TÍTULOS: exposição de conquistas e foco em elementos.
- SANTOS: memória, identidade e emoção.
- LOJA: foco no produto e interação comercial.

Não utilize o mesmo efeito de entrada em todas as páginas apenas para criar consistência. A consistência deve estar no ritmo, na qualidade e na linguagem visual.

## 8. DESEMPENHO E RESPONSIVIDADE

Teste cada seção em desktop e celular.

- Preserve a navegação principal.
- Evite carregamento de imagens desnecessárias.
- Otimize arquivos de imagem.
- Evite animações pesadas em dispositivos menos potentes.
- Utilize carregamento progressivo quando apropriado.
- Garanta que o conteúdo continue acessível caso os efeitos de animação falhem.
- Respeite a preferência por movimento reduzido.
- Evite travamentos, flashes e mudanças bruscas de layout.
- Garanta que todos os controles funcionem por teclado e toque.
- Não bloqueie a rolagem normal sem necessidade.
- Limpe corretamente os listeners e recursos de animação ao sair das seções.

## 9. DADOS, FONTES E DIREITOS DE IMAGEM

A qualidade visual não deve comprometer a precisão histórica.

- Verifique datas, títulos, estatísticas e acontecimentos.
- Diferencie fatos confirmados de informações não verificadas.
- Não apresente resultados futuros como fatos.
- Não invente estatísticas para preencher espaços vazios.
- Inclua créditos e fontes de imagens históricas.
- Utilize imagens com autorização ou licença adequada.
- Não remova marcas d'água nem tente contornar restrições de acesso.
- Se uma informação não puder ser confirmada, omita-a até que seja verificada.

## 10. IMPLEMENTAÇÃO E VALIDAÇÃO

Teste a página, os controles, o celular (375 px) e o console, e corrija os erros. Capture screenshots das
principais seções e dos estados interativos.
