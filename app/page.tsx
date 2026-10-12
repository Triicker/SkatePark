"use client";
import {useState} from 'react';
import {ArrowUpRight,CodeXml,X} from 'lucide-react';
import {Scene} from './scene';
import {SPOTS} from './park-world';
import {Dialog,DialogContent,DialogTitle,DialogDescription,DialogClose} from '@/components/ui/dialog';

const linkedin='https://www.linkedin.com/in/gabriel-bassalo-46aa67207/';
const github='https://github.com/Triicker';
const email='gabrielbassalo@outlook.com';
type Detail={
 eyebrow:string;title:string;subtitle:string;paragraphs:string[];tags:string[];
 action:{text:string;url:string}|null;
 cards?:{label:string;title:string;copy:string}[];
};
// Static for now; this shape can be populated by the GitHub API later without
// changing the dialog or the 3D shop interaction.
const featuredRepositories:NonNullable<Detail['cards']>=[
 {label:'THREE.JS / REACT',title:'SkatePark',copy:'Este portfólio explorável: mundo 3D, física leve, câmera isométrica e fallback em Canvas 2D.'},
 {label:'.NET 10 / TESTES',title:'FinCore',copy:'Fundação para estudar arquitetura de sistemas financeiros, separação em camadas e testes automatizados.'},
 {label:'PRODUTO / EDUCAÇÃO',title:'Nerya / Grow Journeys',copy:'Experimentos digitais voltados a educação, conteúdo, contato e jornadas de aprendizado.'}
];
const details:Detail[]=[
 {eyebrow:'01 / CONHEÇA O DESENVOLVEDOR',title:'Gabriel Bassalo',subtitle:'Software Developer · Salvador, Brasil',paragraphs:[
  'Comecei minha trajetória trabalhando próximo dos sistemas e das pessoas que os utilizam. Essa experiência trouxe um olhar prático para o desenvolvimento: entender o problema antes de escrever a solução.',
  'Hoje trabalho com desenvolvimento de software, principalmente backend com C# e .NET. Gosto de conectar arquitetura, integrações e experiência de produto — e de experimentar formas novas de apresentar tecnologia.'
 ],tags:['C# / .NET','APIs','React','Angular','PostgreSQL','Azure'],action:{text:'Ver LinkedIn',url:linkedin}},
 {eyebrow:'02 / EXPERIÊNCIA PROFISSIONAL',title:'Uma trajetória em construção',subtitle:'Tecnologia, sistemas e serviços financeiros',paragraphs:[
  'Celcoin · Software Engineer — ingresso em julho de 2025.',
  'Pay4Fun · Backend Software Engineer — ingresso em fevereiro de 2024.',
  'Proxys Group / Nordware · Desenvolvedor Backend — ingresso em abril de 2022.',
  'MTM Tecnologia · Desenvolvedor de Software — abril de 2021 a abril de 2022.',
  'A&G Sistemas · Analista de Desenvolvimento e Suporte — junho de 2016 a maio de 2021.'
 ],tags:['Backend','Integrações','Software financeiro','Educação'],action:{text:'Trajetória completa',url:linkedin}},
 {eyebrow:'03 / FORMAÇÃO E APRENDIZADO',title:'Conhecimento em movimento.',subtitle:'Formação contínua · tecnologia e educação',paragraphs:[
  'A formação conecta base acadêmica, estudo contínuo e aplicação prática. Esta área organiza esses marcos sem separar o aprendizado da trajetória profissional.',
  'Cursos, certificações e iniciativas educacionais entram como etapas de evolução — sempre com informações verificadas antes de serem publicadas.'
 ],cards:[
  {label:'BASE ACADÊMICA',title:'Escolaridade e faculdade',copy:'O percurso acadêmico contextualiza a base em tecnologia e a evolução até o desenvolvimento de software.'},
  {label:'FORMAÇÃO CONTÍNUA',title:'Cursos e certificações',copy:'Estudos relevantes em backend, arquitetura, cloud e desenvolvimento web entram como marcos da evolução técnica.'},
  {label:'EDUCAÇÃO APLICADA',title:'Formação de Professores',copy:'Plataforma educacional com módulos de vídeo, leitura e acompanhamento; a área de gestão segue planejada.'}
 ],tags:['Formação acadêmica','Certificações','Arquitetura','Educação'],action:null},
 {eyebrow:'04 / VITRINE DE PROJETOS',title:'Projetos com espaço próprio.',subtitle:'Engenharia financeira · educação · produto digital',paragraphs:[
  'A área reúne trabalhos selecionados em uma mesma região do parque. Cada estação usa poucos elementos para comunicar sua natureza sem perder a identidade low-poly.',
  'Os projetos continuam em evolução e são apresentados pelo que já existe hoje, sem antecipar funcionalidades planejadas.'
 ],cards:[
  {label:'BACKEND / ARQUITETURA',title:'FinCore',copy:'Fundação .NET 10 para estudar sistemas financeiros, arquitetura em camadas e testes unitários e de integração.'},
  {label:'EDUCAÇÃO / DIGITAL',title:'Nerya / Grow Journeys',copy:'Experiências digitais ligadas a aprendizado, apresentação, contato e agendamento de aulas de inglês.'}
 ],tags:['.NET 10','Arquitetura','React','TypeScript'],action:{text:'Conhecer Grow Journeys',url:'https://grow-journeys.lovable.app/'}},
 {eyebrow:'05 / GITHUB DEV SKATE SHOP',title:'Código, peças e projetos.',subtitle:'A oficina técnica do skatepark',paragraphs:[
  'A Dev Skate Shop concentra minha produção técnica: repositórios, estudos, projetos em andamento e as tecnologias que conectam todo o parque.',
  'Os destaques abaixo são estáticos nesta versão, mas usam uma estrutura única que pode ser alimentada pela API do GitHub em uma próxima evolução.'
 ],cards:featuredRepositories,tags:['GitHub','Open source','Three.js','C# / .NET','TypeScript'],action:{text:'Abrir perfil no GitHub',url:github}},
 {eyebrow:'06 / VAMOS CONVERSAR',title:'A próxima linha começa aqui.',subtitle:'Entre em contato',paragraphs:[
  'Quer conversar sobre desenvolvimento de software, arquitetura .NET, produtos ou uma boa ideia? Me mande uma mensagem.'
 ],tags:[],action:{text:'Enviar e-mail',url:`mailto:${email}`}},
];
export default function Home(){
 const [selected,setSelected]=useState<number|null>(null);
 return <main className="portfolio-world">
  <a className="skip" href="#pista">Pular para a pista</a>
  <Scene blocked={selected!==null} onProject={setSelected}/>
  <Dialog open={selected!==null} onOpenChange={open=>{if(!open)setSelected(null)}}>
   <DialogContent className="destination-panel" showCloseButton={false}>
    {selected!==null&&<>
     <div className="panel-heading"><span className="panel-step">{details[selected].eyebrow}</span><DialogClose className="panel-close" aria-label="Voltar para a pista"><X size={18}/></DialogClose></div>
     <div className="panel-destination">{SPOTS[selected].name} / GB SKATEPARK</div>
     <DialogTitle className="panel-title">{details[selected].title}</DialogTitle>
     <DialogDescription className="panel-subtitle">{details[selected].subtitle}</DialogDescription>
     <div className="panel-paragraphs">{details[selected].paragraphs.map(p=><p key={p}>{p}</p>)}</div>
     {details[selected].cards&&<div className="panel-cards">{details[selected].cards.map(card=><article key={card.title}><span>{card.label}</span><h3>{card.title}</h3><p>{card.copy}</p></article>)}</div>}
     {details[selected].tags.length>0&&<div className="panel-tags">{details[selected].tags.map(t=><span key={t}>{t}</span>)}</div>}
     {selected===5&&<div className="panel-links"><a href={github} target="_blank" rel="noreferrer"><CodeXml size={16}/> GitHub <ArrowUpRight size={14}/></a><a href={linkedin} target="_blank" rel="noreferrer"><strong aria-hidden="true">in</strong> LinkedIn <ArrowUpRight size={14}/></a></div>}
     <div className="panel-footer"><span>RETOME A EXPLORAÇÃO QUANDO QUISER</span>{details[selected].action&&<a className="panel-action" href={details[selected].action.url} target={details[selected].action.url.startsWith('mailto:')?undefined:'_blank'} rel={details[selected].action.url.startsWith('mailto:')?undefined:'noreferrer'}>{details[selected].action.text} <ArrowUpRight size={16}/></a>}</div>
    </>}
   </DialogContent>
  </Dialog>
 </main>;
}
