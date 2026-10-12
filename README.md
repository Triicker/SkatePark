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

## Rodando localmente

Requer Node.js 22.13 ou mais recente.

```bash
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite no terminal, normalmente `http://localhost:5173`.

Para validar a versão de produção:

```bash
npm test
```

## Evolução do mapa e da câmera

Nesta fase, a pista passou de `42 × 28` para `48 × 34` unidades — cerca de 39% a mais de área útil. As seis zonas agora ficam distribuídas ao redor de uma praça central, com rotas mais largas e espaço reservado para Sobre mim, Experiência, Formação, Projetos, GitHub e Contato. A área de Projetos já agrupa FinCore e Grow Journeys.

A câmera possui três estados acessíveis pelo controle no rodapé:

- **Normal:** enquadramento intermediário padrão, com o personagem, o caminho e a área próxima;
- **Próxima:** acompanha o skatista com maior aproximação;
- **Visão geral:** centraliza todo o complexo para orientação.

Nos modos Normal e Próxima, o ponto de interesse avança na direção do movimento. A posição é interpolada a cada quadro para suavizar aceleração, curvas e mudanças de enquadramento.

Arquivos principais alterados nesta fase:

- `app/park-world.ts`: dimensões, praça central, distribuição das zonas, obstáculos e elementos urbanos;
- `app/skate-physics.ts`: limites navegáveis e perfis das rampas;
- `app/scene.tsx`: três estados de câmera, enquadramento, antecipação e suavização;
- `app/page.tsx`: alinhamento do conteúdo às zonas Formação e Projetos.

## Formação e reorganização dos projetos

A área de **Formação** ocupa um deck próprio na sequência natural entre Experiência e Projetos. Sua geometria usa degraus progressivos, marcos verticais e um portal aberto para representar evolução, certificados e passagem de conhecimento sem sair da linguagem low-poly. O conteúdo foi organizado em três núcleos: base acadêmica, formação contínua e educação aplicada. Dados específicos de instituições e certificados continuam reservados para publicação somente após confirmação.

A área de **Projetos** agora funciona como uma vitrine única com entrada identificável e duas estações internas:

- **FinCore:** base escura, módulos verticais e detalhes técnicos para sugerir backend e arquitetura;
- **Nerya / Grow Journeys:** volumes mais leves, cor e pórtico aberto para sugerir educação e produto digital.

As placas secundárias das estações aparecem dentro do mesmo bowl e conduzem o visitante ao ponto principal de Projetos. A circulação segue Sobre mim → Experiência → Formação → Projetos e retorna pela praça central em direção a GitHub → Contato, evitando uma organização rigidamente linear.

A área de **GitHub** já contava com deck dedicado, acesso pela praça e área livre ao redor, preparando a transformação final descrita abaixo.

## GitHub Dev Skate Shop e polimento final

O antigo ponto de GitHub virou uma loja-oficina aberta para o parque. A **GitHub Dev Skate Shop** combina fachada própria, balcão de trabalho, dois monitores, ferramentas, prateleiras, decks, rodas e pequenos objetos low-poly. A iluminação quente diferencia a loja das outras zonas sem alterar a paleta principal.

O conteúdo da loja utiliza uma lista estática e tipada de repositórios em `app/page.tsx`. SkatePark, FinCore e Nerya / Grow Journeys aparecem como destaques com suas tecnologias. Essa estrutura pode ser substituída por dados da API do GitHub sem mudar o diálogo ou a interação 3D.

O passe final de composição incluiu:

- rota pontilhada conduzida pela praça central entre Projetos e GitHub;
- moldura e iluminação adicional na praça;
- novos manual pads, rails e bancos nas áreas periféricas;
- fachada e label exclusivos para a Dev Skate Shop;
- revisão dos vazios, preservando corredores largos para circulação;
- manutenção integral dos três modos de câmera e do HUD existente.

Nenhum novo componente React foi criado nesta fase. A loja usa geometria nativa do mundo existente, e os cards reutilizam o diálogo já presente.

Próximas evoluções possíveis:

- integrar a API do GitHub com cache e estados de carregamento;
- abrir detalhes individuais de cada repositório dentro da loja;
- adicionar iluminação noturna opcional e áudio ambiente controlável;
- otimizar o carregamento do Three.js com divisão do bundle;
- criar testes de navegação para teclado, toque e pontos do mapa.

## Quarta etapa: enquadramento e linhas de skate

O parque passou de `48 × 34` para `56 × 36` unidades, aumento de aproximadamente 24% na área útil. A extensão lateral acomoda banks praticáveis nas duas pontas; `groundHeight` e as superfícies visíveis compartilham o mesmo perfil. As linhas Oeste, Formação e Leste ligam as áreas existentes com curbs, manual pads, rails e escadas baixas. A praça mantém as árvores e sua função de distribuição central.

A câmera **Normal** usa uma abertura ortográfica intermediária de 18,2 unidades verticais no desktop (17,1 no celular), entre a **Próxima** e a **Visão geral**. A direção isométrica, o acompanhamento adiantado e o damping são os mesmos da fase anterior; a escala da Visão geral não foi alterada.

O corte do HUD em janelas baixas vinha da altura mínima de 500 px aplicada a um contêiner com `overflow: hidden`. O contêiner agora acompanha a altura real do viewport; o título e o rodapé permanecem em uma camada de interface independente da câmera e da projeção 3D.

As duas placas secundárias de Projetos aparecem apenas perto da área na câmera Normal ou Próxima. O bowl azul e as estações continuam identificáveis pelo cenário; a Visão geral conserva o rótulo principal de Projetos. A GitHub Shop permanece no mesmo local com fachada aberta, decks, rodas, prateleira, bancada, monitores e ferramentas compactas.

Arquivos alterados nesta etapa:

- `app/scene.tsx`: abertura da câmera Normal e visibilidade contextual das placas de projetos;
- `app/globals.css`: altura do viewport e camada do HUD;
- `app/skate-physics.ts`: limites ampliados e altura das novas banks;
- `app/park-world.ts`: piso ampliado e linhas de obstáculos conectando as seis regiões;
- `README.md`: decisões de enquadramento, circulação e validação.
