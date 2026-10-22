# Retratos do Vestiário — produção na Higgsfield

O Vestiário já funciona. Cada capítulo sem retrato mostra a silhueta com o aviso
"Retrato em produção". Quando o arquivo do retrato existir, ele entra sozinho, sem mexer no código.

| Capítulo | Arquivo esperado | Situação |
|---|---|---|
| Santos I (2009–2013) | `assets/retratos/santos-origem.webp` | **gerar** |
| Barcelona (2013–2017) | `assets/retratos/barcelona.webp` | **gerar** |
| PSG (2017–2023) | `assets/retratos/psg.webp` | **gerar** |
| Al-Hilal (2023–2025) | `assets/retratos/al-hilal.webp` | **gerar** |
| Santos II (2025–) | `assets/retratos/santos-retorno.webp` | **gerar** |
| Seleção (2010–2026) | `assets/retratos/selecao.webp` | pronto (foto oficial do hero) |

## Padrão de composição (vale para todos)

A **imagem de referência principal** é o retrato da Seleção:
`vestiario/assets/retratos/selecao.webp` (é a mesma foto do hero do site).
Todos os outros retratos são essa imagem com **só o uniforme trocado**.

- Mesma pessoa, mesmo rosto, cabelo, barba, brincos e tatuagens do pescoço.
- Mesma pose: de frente, ombros retos, braços para baixo, leve sorriso.
- Mesmo enquadramento: topo da cabeça a ~15% do alto, corte na altura da cintura.
- Fundo **branco liso** (o site mistura o retrato com o holofote do vestiário; fundo
  cinza, creme ou com sombra aparece como uma caixa).
- Luz de estúdio frontal e suave, igual à da referência.
- Proporção vertical **7:8** (ou 3:4: o script completa o quadro).
- **Sem escudos, sem patrocinadores, sem números na frente e sem marca de material
  esportivo.** Modelos de imagem erram escudos e patrocínios com frequência, e esses
  erros são justamente o que denuncia uma montagem. Cor, padrão e gola corretos
  bastam para reconhecer a época.

**Modelo sugerido:** Nano Banana Pro (edição com imagem de referência, preserva bem a
identidade). Alternativa: GPT Image 2.5 com a mesma referência.

## Prompts

Anexe sempre `selecao.webp` como referência e use o prompt do capítulo. O texto comum
abaixo vem antes de cada descrição de uniforme.

**Texto comum (cole antes de cada prompt):**

> Edit the reference photo. Keep the exact same man, face, hairstyle, beard, earrings,
> neck tattoos, expression, pose, framing, camera angle, scale and studio lighting.
> Keep a plain pure white seamless background. Only replace the clothing with the kit
> described below. Photorealistic editorial sports portrait, natural fabric folds,
> correct anatomy. No crest, no badge, no sponsor text, no brand logo, no numbers, no
> watermark.

**Santos I — 2009 a 2013**
> Kit: classic all-white short-sleeve football jersey, slim black crew collar and thin
> black cuff trim, matte performance fabric typical of 2011.

**Barcelona — 2013 a 2017**
> Kit: football jersey with bold vertical stripes in deep garnet red (#a50044) and royal
> blue (#004d98), thin yellow collar trim, short sleeves, mid-2010s cut.

**PSG — 2017 a 2023**
> Kit: dark navy blue football jersey (#004170) with a single wide vertical red stripe
> down the center front bordered by thin white stripes, navy short sleeves, crew collar.

**Al-Hilal — 2023 a 2025**
> Kit: royal blue football jersey (#005eb8) with subtle tonal pattern, white collar and
> white cuff trim, short sleeves, 2023 modern athletic cut.

**Santos II — 2025 em diante**
> Kit: football jersey with vertical black and white stripes of equal width, black crew
> collar, short sleeves, modern 2025 athletic cut.
> *(Listras pretas e brancas: o segundo uniforme tradicional do Santos. Diferencia a volta
> do capítulo de 2009–2013 sem inventar detalhes de um modelo específico.)*

## Conferência antes de usar

- O rosto é o mesmo da referência? Tatuagens e brincos no lugar?
- Mãos, pescoço e contorno do cabelo limpos, sem borrões?
- Nenhum escudo, letra ou logo apareceu? (Se aparecer, gere de novo.)
- Fundo branco liso, sem sombra no chão?

## Como colocar no site

```bash
python vestiario/tools/prep_retrato.py caminho/do/arquivo.png barcelona
```

O script deixa o fundo branco puro, encaixa no quadro 2048×2336 e salva em
`assets/retratos/<id>.webp`. Se o enquadramento ficar um pouco diferente do retrato da
Seleção, ajuste em `capitulos.json` → `retrato.ajuste` (`escala`, `x` e `y` em %), sem
mexer no código.

Os retratos gerados são arte digital. O crédito aparece no painel de cada capítulo
(`retratoCredito` em `capitulos.json`).
