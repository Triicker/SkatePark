"use client";
import {useState} from 'react';
import {ArrowUpRight,CodeXml,X} from 'lucide-react';
import {Scene} from './scene';
import {SPOTS} from './park-world';
import {Dialog,DialogContent,DialogTitle,DialogDescription,DialogClose} from '@/components/ui/dialog';

const linkedin='https://www.linkedin.com/in/gabriel-bassalo-46aa67207/';
const github='https://github.com/Triicker';
const email='gabrielbassalo@outlook.com';
const details=[
 {eyebrow:'01 / CONHEÇA O DESENVOLVEDOR',title:'Gabriel Bassalo',subtitle:'Software Developer · Salvador, Brasil',paragraphs:[
  'Comecei minha trajetória trabalhando próximo dos sistemas e das pessoas que os utilizam. Essa experiência trouxe um olhar prático para o desenvolvimento: entender o problema antes de escrever a solução.',
  'Hoje trabalho com desenvolvimento de software, principalmente backend com C# e .NET. Gosto de conectar arquitetura, integrações e experiência de produto — e de experimentar formas novas de apresentar tecnologia.'
 ],tags:['C# / .NET','APIs','React','Angular','PostgreSQL','Azure'],action:{text:'Ver LinkedIn',url:linkedin}},
 {eyebrow:'02 / EXPERIÊNCIA PROFISSIONAL',title:'Uma trajetória em construção',subtitle:'Tecnologia, sistemas e serviços financeiros',paragraphs:[
  'Celcoin · Software Engineer — ingresso em julho de 2025.',
  'Pay4Fun · Backend Software Engineer — ingresso em fevereiro de 2024.',
  'Proxys Group / Nordware · Desenvolvedor Backend — ingresso em abril de 2022.',
  'MTM Tecnologia · Desenvolvedor de Software — abril de 2021 a abril de 2022.',
  'A&G Sistemas · Analista de Desenvolvimento e Suporte — junho de 2016 a maio de 2021.',
  'Também desenvolvo uma plataforma de Formação de Professores, com módulos de vídeo, leitura e acompanhamento. A área de gestão ainda está planejada.'
 ],tags:['Backend','Integrações','Software financeiro','Educação'],action:{text:'Trajetória completa',url:linkedin}},
 {eyebrow:'03 / PROJETO EM DESENVOLVIMENTO',title:'FinCore',subtitle:'Fundação .NET para o mercado financeiro',paragraphs:[
  'Projeto de estudo para evoluir na engenharia de sistemas financeiros, com foco em backend, arquitetura e testes.',
  'Solução .NET 10 dividida em API, Application, Domain e Infrastructure, com testes unitários e de integração. A fundação técnica está concluída; as funcionalidades financeiras serão implementadas nas próximas etapas.'
 ],tags:['C#','.NET 10','Arquitetura','Testes'],action:null},
 {eyebrow:'04 / EXPERIÊNCIA DIGITAL',title:'Grow Journeys',subtitle:'Uma jornada de aprendizado de inglês',paragraphs:[
  'Site de apresentação, contato e agendamento de aulas de inglês. O fluxo de captação de interessados inclui validação no servidor e envio por e-mail com Resend.',
  'As áreas de aluno, planos, créditos e reservas permanecem em prototipação com dados simulados.'
 ],tags:['React','TypeScript','TanStack Start','Resend'],action:{text:'Conhecer o projeto',url:'https://grow-journeys.lovable.app/'}},
 {eyebrow:'05 / LABORATÓRIO',title:'Do código à pista.',subtitle:'GitHub · projetos e experimentos',paragraphs:[
  'Aqui compartilho projetos de estudo, experiências de produto e a evolução desta própria pista interativa.',
  'FinCore reúne minha exploração de arquitetura .NET para sistemas financeiros. O skatepark combina Three.js, movimento e uma interface navegável em um só mundo.'
 ],tags:['Open source','Three.js','C# / .NET','TypeScript'],action:{text:'Ver o código deste site',url:'https://github.com/Triicker/SkatePark'}},
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
     {details[selected].tags.length>0&&<div className="panel-tags">{details[selected].tags.map(t=><span key={t}>{t}</span>)}</div>}
     {selected===5&&<div className="panel-links"><a href={github} target="_blank" rel="noreferrer"><CodeXml size={16}/> GitHub <ArrowUpRight size={14}/></a><a href={linkedin} target="_blank" rel="noreferrer"><strong aria-hidden="true">in</strong> LinkedIn <ArrowUpRight size={14}/></a></div>}
     <div className="panel-footer"><span>RETOME A EXPLORAÇÃO QUANDO QUISER</span>{details[selected].action&&<a className="panel-action" href={details[selected].action.url} target={details[selected].action.url.startsWith('mailto:')?undefined:'_blank'} rel={details[selected].action.url.startsWith('mailto:')?undefined:'noreferrer'}>{details[selected].action.text} <ArrowUpRight size={16}/></a>}</div>
    </>}
   </DialogContent>
  </Dialog>
 </main>;
}
