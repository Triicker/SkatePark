# Gabriel Bassalo — Developer Skatepark

Portfólio interativo em uma única pista. Um skatista conduz o visitante pelos seis pontos da experiência: Sobre mim, Experiência, FinCore, Grow Journeys, Formação e Contato.

## Como explorar
- Desktop: WASD ou setas movem o skatista; espaço faz ollie; F faz kickflip; E ou Enter abre as informações do ponto próximo.
- Mouse: clique na pista para definir um destino. Clique nas placas projetadas para mandar o skatista até elas.
- Mapa: escolha um ponto e o skatista se desloca até ele. A câmera o acompanha. O botão de visão geral mostra a pista inteira.
- Celular: direcional, botões de ollie e flip, mapa e placas.
- Pausar e reiniciar têm controles visíveis. Preferência de movimento reduzido afeta apenas a animação secundária, sem bloquear a jogabilidade.
- A cena usa Three.js/WebGL quando possível; se o navegador não disponibilizar WebGL 2, uma projeção de geometria 3D em Canvas 2D mantém o mesmo mundo e a mesma física jogáveis.

## Conteúdo e precisão
Informações profissionais obtidas do LinkedIn público https://www.linkedin.com/in/gabriel-bassalo-46aa67207/ e do histórico já fornecido pelo usuário. As datas profissionais indicam ingresso, não presumem vínculo atual. FinCore e as plataformas de educação são identificados pelo estado de desenvolvimento descrito, sem anunciar funções planejadas como prontas.

Referências de direção: https://bruno-simon.com/ para exploração em mundo 3D; https://www.ea.com/games/skate/skate/features/san-vansterdam para pontos de skate; https://lusion.co/ para contenção de interface e hierarquia visual. Geometrias, personagem e identidade próprios.

## Estrutura
`app/page.tsx` contém as informações mostradas ao descobrir os pontos. `app/park-world.ts` constrói a pista. `app/scene.tsx` cuida da câmera, física e controles. `app/skate-physics.ts` reúne limites, direção e altura das rampas. `app/software-renderer.ts` mantém a pista funcionando sem WebGL. `app/globals.css` estabelece a interface.

A pista é um espaço explorável com aceleração, frenagem simplificada, saltos, rampas e limites; não simula colisões rígidas com todos os elementos decorativos.
