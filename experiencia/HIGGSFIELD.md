# Neymar: The Experience: artes da Higgsfield

A experiência **já funciona sem nenhuma arte nova**. Ela usa o retrato do hero da home reiluminado em
tempo real e fotos licenciadas do Wikimedia Commons. As quatro artes abaixo servem para elevar o
acabamento. Cada uma entra sozinha quando o arquivo existe e o manifesto
`experiencia/assets/higgsfield.json` marca `"pronto": true`.

> Nada aqui foi gerado ainda. A conta da Higgsfield está em período de teste. Nesse período a geração
> não funciona pela linha de comando e pede upgrade no site. Os caminhos abaixo estão reservados e os
> prompts estão prontos.

## 1. Direção de arte (vale para todas)

| Item | Regra |
|---|---|
| Linguagem | Campanha esportiva editorial, realista. Nada de ficção científica, neon, holograma ou cidade futurista. |
| Paleta | Preto profundo (#050506), cinza-grafite, luz branca levemente quente (≈4300 K), **um único acento amarelo** (#fedd00) quando houver. O verde (#009c3b) só em detalhe. |
| Luz | Sempre **uma fonte principal direcional, vinda do alto à esquerda**, com feixe visível em ar levemente enfumaçado (volumetria suave). Contraluz fraco do lado oposto. Sombras densas, sem preenchimento. |
| Câmera | 35 mm a 50 mm, altura dos olhos, sem grande angular deformando. Profundidade de campo rasa nas cenas íntimas e média nas amplas. |
| Textura | Grão de filme fino, sem nitidez artificial, sem pele de plástico. |
| Composição | Muito espaço negativo. O protagonista nunca fica no centro exato, exceto no Legado. Deixe o **terço esquerdo livre para tipografia** nas artes 1, 2 e 3. |
| Proibido | Escudos, patrocinadores, números de camisa, marcas de material esportivo, texto, logotipos, marca d'água, multidão com rostos nítidos. |
| Identidade | Mesma pessoa em todas as artes. Use como referência `assets/hero/person-diffuse.webp` e `vestiario/assets/retratos/selecao.webp`, que mostram rosto, barba, cabelo e tatuagens do pescoço. |

**Modelo sugerido:** Nano Banana Pro, em 4K e 16:9, com as duas imagens de referência. Gere 2 a 4 variações
por arte e escolha a que mais conversa com as outras: mesma luz, mesmo grão, mesma cor de preto.

## 2. As artes

### 1. `entrada-fundo`: fundo dos atos I e II
- **Arquivo:** `experiencia/assets/higgsfield/entrada-fundo.webp`, 3840×2160, sem pessoas.
- **Uso:** placa de fundo atrás do retrato reiluminado. O protagonista é sobreposto pelo site no terço
  direito, então a área do centro à direita deve ser escura e limpa.
- **Prompt:**
  > Empty dark photographic studio that feels like a stadium tunnel, deep black background, a single hard
  > spotlight beam entering from the top left through light haze, visible volumetric light shaft and
  > floating dust, concrete floor barely visible, the right two thirds of the frame almost black and
  > clean, cinematic sports campaign photography, 35mm, fine film grain, no people, no text, no logos.

### 2. `talento`: cena Talento
- **Arquivo:** `experiencia/assets/higgsfield/talento.webp`, 3840×2160.
- **Uso:** substitui a foto do Mundial de 2011. O texto fica no terço esquerdo e a câmera faz um
  avanço lento pela imagem.
- **Prompt (com as duas referências):**
  > Intimate cinematic close-up portrait of the same man from the reference images, in profile looking to
  > the right, positioned in the right half of the frame, eyes focused, calm concentration, single hard key
  > light from the top left grazing the face, deep black background with soft haze, plain black training
  > shirt with no logos, natural skin texture, shallow depth of field, 50mm, fine film grain, left third of
  > the frame empty and dark, no text, no logos, no numbers.

### 3. `garra`: cena Competitividade
- **Arquivo:** `experiencia/assets/higgsfield/garra.webp`, 3840×2160.
- **Uso:** substitui a foto do Camp Nou. A cena entra em persianas horizontais e o site aplica preto e
  branco de alto contraste, então a imagem precisa funcionar em P&B.
- **Prompt (com as duas referências):**
  > The same man from the reference images seen from behind at mid distance, walking out of a dark stadium
  > tunnel toward a blinding wall of floodlight, silhouette with a bright rim light, wearing a plain dark
  > football kit with no logos and no number, mist in the air, strong contrast, epic but realistic sports
  > campaign photography, 35mm, fine film grain, subject slightly right of center, no text, no crowd faces.

### 4. `legado-fundo`: fundo do ato IV
- **Arquivo:** `experiencia/assets/higgsfield/legado-fundo.webp`, 3840×2160, sem pessoas.
- **Uso:** placa de fundo do final. O site coloca o protagonista pequeno no centro, embaixo do feixe,
  e o título fica no alto. O centro precisa estar vazio, com a luz caindo sobre ele.
- **Prompt:**
  > Empty football stadium at night seen from pitch level, the stands dissolving into darkness, a single
  > vertical beam of white light falling from the roof onto the center of the pitch, light haze, floating
  > dust, the upper half of the frame dark and calm for typography, symmetrical composition, realistic,
  > cinematic, 35mm, fine film grain, no people, no text, no logos, no advertising boards.

## 3. Como colocar no site

1. Exporte em PNG ou JPG e converta para WebP com qualidade 82:
   `python -c "from PIL import Image; Image.open('entrada.png').convert('RGB').resize((3840,2160)).save('experiencia/assets/higgsfield/entrada-fundo.webp', quality=82)"`
2. Em `experiencia/assets/higgsfield.json`, mude `"pronto": false` para `"pronto": true` na arte.
3. Recarregue `/experiencia/`. Os fundos aparecem atrás do retrato; Talento e Garra trocam as fotos.
   O crédito passa a dizer "Arte digital gerada com Higgsfield", porque essas imagens não são fotos de
   um acontecimento real.

## 4. O que não deve ser gerado

- **Cena Impacto:** continua com a foto real da Copa de 2026 (YantsImages, CC BY-SA 4.0). Uma multidão
  de fotógrafos gerada por IA pareceria um registro de um acontecimento que não existiu.
- **Cena Criatividade:** usa o alter ego que já está na home (`assets/hero/overlay.webp`), alinhado
  pixel a pixel ao retrato do hero. Uma arte nova perderia esse alinhamento.
- **O retrato principal:** a reiluminação depende dos mapas de normal e de profundidade do hero.
  Um retrato novo exigiria novos mapas e deixaria de combinar com a transição da home.
