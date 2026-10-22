# Site Neymar Jr

Cópia local de https://neymar-aula.vercel.app/ (HTML único + `assets/`).
Three.js e Lenis vêm do jsDelivr; todas as imagens e SVGs estão em `assets/`
(os que o original buscava no storage do Layers ficam em `assets/remote/`).

## Rodar

Os módulos precisam de um servidor (não abre direto pelo `file://`):

```bash
cd Site-Neymar
python -m http.server 8080
# abra http://localhost:8080
```

## Estrutura

```
index.html        página inteira (CSS + JS inline)
assets/hero/      foto, mapas de profundidade/normal/alfa e overlay do Coringa
assets/ui/        logo, campo, camisa, máscara da bola
assets/timeline/  fotos 2011–2026 (créditos no rodapé)
assets/paddock/   retrato pintado
assets/footer/    Neymar máscara/Coringa e máscara do logo
assets/remote/    ruído do shader, ícones, botão de play, linhas de fundo
_versao-anterior/ versão antiga do site, antes da cópia
```
