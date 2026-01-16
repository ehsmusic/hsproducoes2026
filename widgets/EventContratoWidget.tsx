
import React, { useRef, useState, useEffect } from 'react';
import { HSEvent, HSEventFinance, UserProfile, UserRole } from '../types';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { PenTool, CheckCircle2, Download, Loader2, ShieldCheck, Clock, Trash2, Printer } from 'lucide-react';

interface Props {
  event: HSEvent;
  userProfile: UserProfile;
  financeDoc: HSEventFinance | null;
  equipeNomes: string[];
  onSignComplete?: () => void;
}

const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxHnSO4bwmjU1tjq74X5myWNOy3L7se7_AxEGf-OIomdkHwlUrNbAXBOmT1WMKzhtm6/exec";

function escreverValorPorExtenso(valor: number): string {
  const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const dezena1 = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
  if (valor === 0) return "zero reais";
  const centavos = Math.round((valor % 1) * 100);
  const reais = Math.floor(valor);
  const formatar = (n: number) => {
    if (n === 0) return "";
    if (n === 100) return "cem";
    let output = "";
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    if (c > 0) output += centenas[c];
    if (d > 0) {
      if (output) output += " e ";
      if (d === 1) { output += dezena1[u]; return output; }
      output += dezenas[d];
    }
    if (u > 0) {
      if (output) output += " e ";
      output += unidades[u];
    }
    return output;
  };
  let extenso = "";
  const milhoes = Math.floor(reais / 1000000);
  const milhares = Math.floor((reais % 1000000) / 1000);
  const unidades_reais = reais % 1000;
  if (milhoes > 0) extenso += formatar(milhoes) + (milhoes > 1 ? " milhões" : " milhão");
  if (milhares > 0) {
    if (extenso) extenso += " e ";
    extenso += formatar(milhares) + " mil";
  }
  if (unidades_reais > 0) {
    if (extenso) extenso += (reais > 1000 && unidades_reais < 100 ? " e " : " ");
    extenso += formatar(unidades_reais);
  }
  extenso += reais === 1 ? " real" : " reais";
  if (centavos > 0) extenso += " e " + formatar(centavos) + (centavos === 1 ? " centavo" : " centavos");
  return extenso.charAt(0).toUpperCase() + extenso.slice(1);
}

const EventContratoWidget: React.FC<Props> = ({ event, userProfile, financeDoc, equipeNomes, onSignComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contratante, setContratante] = useState<UserProfile | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  useEffect(() => {
    const fetchContratante = async () => {
      if (event.contratanteId) {
        const d = await getDoc(doc(db, 'users', event.contratanteId));
        if (d.exists()) setContratante(d.data() as UserProfile);
      }
    };
    fetchContratante();
  }, [event.contratanteId]);

  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsSigning(true);
  };

  const draw = (e: any) => {
    if (!isSigning) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsSigning(false);
    if (canvasRef.current) setSignatureData(canvasRef.current.toDataURL());
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureData(null);
    }
  };

  const handleSignContract = async () => {
    if (!signatureData || isSubmitting || event.contractUrl) return;
    setIsSubmitting(true);
    
    try {
      const valorShow = financeDoc?.valorEvento || 0;
      const dataPayload = {
        id: event.id,
        nome: contratante?.displayName || 'Não informado',
        cpf: contratante?.pixKey || 'Não informado',
        endereco: contratante?.endereco || 'Não informado',
        telefone: contratante?.phoneNumber || 'Não informado',
        data_show_: event.dataEvento || 'Não informado',
        cidade: event.local.split('-')[1]?.trim() || event.local,
        endereco_show: event.enderecoEvento,
        hora_show: event.horaEvento,
        duracao_show: `${event.duracao} horas`,
        equipe: equipeNomes.join(', '),
        valor_show: valorShow.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        valor_extenso: escreverValorPorExtenso(valorShow),
        forma_pagamento: event.somContratado ? "Entrada de 30% e o restante no dia do show" : "À vista",
        assinatura: signatureData,
        conta_equipe: (equipeNomes.length || 0)
      };

      await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(dataPayload)
      });

      alert("Assinatura enviada! O sistema está gerando seu PDF e o link aparecerá em alguns segundos.");
      if (onSignComplete) onSignComplete();

    } catch (err) {
      console.error("ERRO:", err);
      alert("Houve um problema no envio. Verifique sua conexão ou tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const dataShowFormatada = event.dataEvento ? new Date(event.dataEvento + 'T00:00:00').toLocaleDateString('pt-BR') : '<<data_show_>>';
  const valorShowNum = financeDoc?.valorEvento || 0;
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const dataContrato = new Date();
  const dataContratoFormatada = `${dataContrato.getDate()} de ${meses[dataContrato.getMonth()]} de ${dataContrato.getFullYear()}`;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-6 md:p-12 shadow-2xl overflow-hidden relative">
        <div className="relative z-10 space-y-10">
          <div className="flex items-center justify-between border-b border-slate-800 pb-8">
            <div className="flex items-center space-x-5">
              <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter italic">Contrato Jurídico</h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">HS Produções • Oficial</p>
              </div>
            </div>
            <button onClick={() => window.print()} className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition-all">
              <Printer size={20} />
            </button>
          </div>

          <div className="bg-white p-8 md:p-16 rounded-[2rem] text-slate-900 font-serif leading-relaxed text-[13px] md:text-[15px] shadow-inner max-h-[800px] overflow-y-auto custom-scrollbar-light">
            <div className="space-y-6 text-justify">
              <h1 className="font-black text-center text-lg md:text-xl border-b-2 border-slate-900 pb-4 mb-8 uppercase">
                CONTRATO DE PRESTAÇÃO DE SERVIÇOS ARTÍSTICOS HELDER SANTOS
              </h1>
              <p>Pelo presente instrumento particular de contrato de prestação de serviços artísticos, as partes:</p>
              
              <p>
                <span className="font-bold">HS PRODUÇÕES CNPJ: 49.178.368/0001-33</span>, com sede na Rua Benedito dos Santos, 447, Lençóis Paulista - SP, CEP 18.683-800, Aqui representada por Helder Francisco Santos portador do CPF. 421.978.698-84 e, RG. 41.014.482-4 doravante denominada “CONTRATADA”,
              </p>

              <p>
                E <span className="font-bold underline">{contratante?.displayName || '<<nome>>'}</span> portador do CPF <span className="font-bold underline">{contratante?.pixKey || '<<cpf>>'}</span> com sede na rua <span className="font-bold underline">{contratante?.endereco || '<<endereco>>'}</span>, contato <span className="font-bold underline">{contratante?.phoneNumber || '<<telefone>>'}</span>, doravante denominada “CONTRANTE”, têm entre si justo e acertado, o seguinte:
              </p>

              <h3 className="font-bold text-center uppercase tracking-widest pt-4 underline">DO OBJETO</h3>
              <p>
                O presente contrato tem por objeto, a prestação de serviços artísticos composto de um (01) “Show Musical” do cantor Helder Santos, a ser realizado no dia <span className="font-bold underline">{dataShowFormatada}</span> na cidade <span className="font-bold underline">{event.local.split('-')[1]?.trim() || event.local}</span> no local <span className="font-bold underline">{event.enderecoEvento}</span>” com início previsto para as <span className="font-bold underline">{event.horaEvento}</span>.
              </p>
              <p>
                A CONTRATADA se compromete a realizar sua apresentação artística em aproximadamente <span className="font-bold underline">{event.duracao} horas</span> com banda completa composta por: <span className="font-bold underline">{equipeNomes.join(', ') || 'equipe técnica'}</span>.
              </p>
              <p>
                A CONTRATADA fica desobrigada de realizar o espetáculo ou até mesmo interrompê-lo caso ocorra interferência por pessoas da plateia ou até por parte de terceiros, de forma a prejudicar a performance artística necessária a boa e saudável apresentação.
              </p>
              <p>
                A “CONTRATADA” prestará os serviços sem qualquer vínculo empregatício com a “CONTRATANTE”.
              </p>

              <h3 className="font-bold text-center uppercase tracking-widest pt-4 underline">DO PAGAMENTO</h3>
              <p>
                Como remuneração do “Show Musical” ora contratado e apresentado à “CONTRATANTE”, esta pagará o valor de: <span className="font-bold underline">R$ {valorShowNum.toLocaleString('pt-BR')} ({escreverValorPorExtenso(valorShowNum)})</span> em moeda corrente da seguinte maneira:
                <br />
                <span className="font-bold underline">{event.somContratado ? "Entrada de 30% do valor e o restante no dia do evento" : "Pagamento integral à vista na assinatura"}</span>
              </p>

              <div className="border border-slate-300 p-6 font-mono text-xs bg-slate-50 space-y-1">
                <p>BANCO NUBANK 0260</p>
                <p>AGÊNCIA 0001</p>
                <p>CONTA CORRENTE 65568230-3</p>
                <p>HS PRODUÇÕES</p>
                <p>PIX CNPJ: 49.178.368/0001-33</p>
              </div>

              <p>2.1- O atraso ou falta de pagamento do valor e nas datas estipuladas na cláusula acima, implica no cancelamento automático do show.</p>

              <h3 className="font-bold text-center uppercase tracking-widest pt-4 underline">DA RESPONSABILIDADE DO CONTRATANTE</h3>
              <p>Os custos com, palco e equipamento de som e luz, correrão por conta do CONTRATANTE (Rider técnico e Camarim em anexo)</p>
              <p>3.1- Fica obrigado o CONTRATANTE a fornecer o local do evento, bem como o palco coberto e montado, com todas as condições técnicas de segurança, a fim de restar salvaguardada a integridade física e psíquica dos artistas, bem como a do público em geral.</p>
              <p>3.2- O CONTRATANTE deverá fornecer alimentação para <span className="font-bold underline">{(equipeNomes.length || 0)}</span> pessoas, bem como local apropriado para refeição.</p>
              <p>3.3- Fica expressamente vedado o emprego de quaisquer tipos de propaganda sem prévio aviso, seja comercial, ou de cunho político, no fundo do palco onde ocorrerá a apresentação do artista, sob pena do mesmo não se apresentar, não incorrendo nas multas contratuais.</p>
              <p>3.4- Caberá ao CONTRATANTE providenciar todas as autorizações necessárias para a realização do evento, tais como alvarás e afins, bem como pagar impostos, taxas ou contribuições referentes ao evento, no âmbito do Município, do Estado e da União.</p>
              <p>3.5- Quaisquer danos que porventura venham a ocorrer aos instrumentos utilizados na apresentação seja antes, durante ou após a realização do evento, causados por excesso de público, tumultos, brigas, serão de total e inteira responsabilidade do CONTRATANTE e seus representantes, devendo os mesmos responderem pela reparação ou reposição do equipamento avariado.</p>
              <p>3.6- A contratação de uma equipe de segurança – em quantidade proporcional à capacidade de presença do público local – para a guarda dos artistas, dos instrumentos musicais e dos equipamentos de palco, fica como obrigação do CONTRATANTE. Cabe ao mesmo, demais disto, fornecerem profissionais gabaritados para a produção e organização do evento.</p>
              <p>3.7- O CONTRATANTE será responsável por fornecer, indeclinavelmente no local do evento, camarim com instalações adequadas, contendo mesas, cadeiras, espelho, etc. e lista de camarim enviado pelo contratado.</p>
              <p>Parágrafo único – Todos os itens exigidos no caput da presente cláusula deverão estar à disposição da produção do espetáculo 06 (seis) horas antes da apresentação.</p>

              <h3 className="font-bold text-center uppercase tracking-widest pt-4 underline">DA RESCISÃO CONTRATUAL</h3>
              <p>4- O presente contrato poderá ser rescindido unilateralmente por qualquer uma das partes, desde que haja comunicação formal por escrito justificando o motivo e deverá acontecer em até 180 (cento e oitenta) dias corridos antes da data prevista para o evento, sendo devolvido integralmente o valor da entrada ao “CONTRATANTE”. Após este período, em até 90 dias corridos da data do evento o valor a ser devolvido será de 40% da entrada, de 90 dias corridos até a data do evento o valor da entrada não será ressarcido, para que ambas as partes não sejam prejudicadas.</p>

              <h3 className="font-bold text-center uppercase tracking-widest pt-4 underline">DAS MULTAS CONTRATUAIS</h3>
              <p>5- Salvo o caso de rescisão já previsto na cláusula imediatamente anterior, fica estabelecido que a parte infratora a quaisquer cláusulas do presente contrato pagará à parte prejudicada multa equivalente a 30% (Trinta Por Cento) sobre o valor do contrato, independente de ação judicial específica para ressarcimento de perdas e danos que poderá ser movida, obviamente, pela parte prejudicada.</p>

              <h3 className="font-bold text-center uppercase tracking-widest pt-4 underline">DAS DISPOSIÇÕES GERAIS</h3>
              <p>6 - Eventualmente, caso o artista venha a ficar doente e/ou acamado, as partes estudarão a substituição do mesmo por outra banda de mesmo nível, limitado ao valor deste contrato, caso haja excedente, o valor deverá ser pago pelo “CONTRATANTE”, caso não ocorra um acordo entre as partes, o “CONTRADO” se compromete com a devolução do valor correspondente pago pelo “CONTRATANTE”, permanecendo, porém, inalteradas as demais cláusulas deste CONTRATO.</p>
              <p>Parágrafo único – O disposto acima também se aplicará em situações de caso fortuito ou força maior, caso tornem impossível a concretização do espetáculo.</p>
              <p>6.1- Este instrumento deverá ser devidamente subscrito, preferencialmente, 180 dias antes do evento a fim de serem tomadas, em tempo, as providências necessárias à realização do mesmo.</p>

              <h3 className="font-bold text-center uppercase tracking-widest pt-4 underline">DO FORO</h3>
              <p>7- Todas as pendências jurídicas que possam vir a decorrer desta relação contratual serão dirimidas no foro da comarca de Lençóis Paulista / SP. Por estarem, assim justos e contratados, firmam o presente instrumento, em 02 (duas) cópias de igual teor e forma.</p>

              <p>Lençóis Paulista, <span className="font-bold underline">{dataContratoFormatada}</span>.</p>

              <div className="pt-20 text-center space-y-4">
                 <p className="font-bold uppercase tracking-widest border-b border-slate-900 inline-block px-12 pb-2">Assinado Digitalmente</p>
                 {signatureData && <img src={signatureData} className="mx-auto h-24 mt-4" alt="Assinatura" />}
              </div>

              <div className="pt-12 border-t border-slate-200 space-y-4">
                <h2 className="font-black text-center text-lg uppercase">Camarim Artista</h2>
                <p className="font-bold">SUGESTÃO DE CAMARIM:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>2 Mesas compatíveis;</li>
                  <li>Cadeiras para acomodação de 07 pessoas;</li>
                  <li>Banheiro próximo;</li>
                  <li>10 Garrafinhas de água (camarim);</li>
                  <li>10 Garrafinhas de água (palco);</li>
                  <li>10 Latas Refrigerantes (coca-cola, sprite e guaraná);</li>
                  <li>2 Litros de Suco Del Valle (2 sabores);</li>
                  <li>1 Tábuas de frios e sanduíche de metro ou salgados sortidos.</li>
                  <li>Copos, Pratos, Talheres, Guardanapos, etc;</li>
                  <li>10 GARRAFINHAS DE ÁGUA NATURAL/GELADA PARA MONTAGEM E PASSAGEM DE SOM</li>
                </ul>
                <p className="text-xs italic"><span className="font-bold">Observação:</span> Caso o “CONTRATANTE” não opte pelo serviço de buffet para os músicos é solicitado valor de R$600,00 (seiscentos reais) para que o artista providencie a alimentação adequada.</p>
              </div>
            </div>
          </div>

          {event.contractUrl ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] p-10 flex flex-col items-center text-center space-y-6">
              <CheckCircle2 size={48} className="text-emerald-500" />
              <div>
                <h4 className="text-xl font-black text-white uppercase italic">Contrato Formalizado</h4>
                <p className="text-slate-400 text-sm mt-2">O arquivo oficial já consta no sistema.</p>
              </div>
              <a href={event.contractUrl} target="_blank" rel="noreferrer" className="flex items-center space-x-3 px-10 py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl">
                <Download size={20} /> <span>Visualizar Contrato PDF</span>
              </a>
            </div>
          ) : userProfile.role === UserRole.CONTRATANTE ? (
            <div className="space-y-8 border-t border-slate-800 pt-12">
              <div className="flex flex-col items-center space-y-6">
                <h4 className="text-xs font-black text-white uppercase tracking-[0.4em] flex items-center">
                  <PenTool size={16} className="mr-3 text-blue-500" /> Assinatura Digital do Contratante
                </h4>
                <div className="relative bg-white rounded-[2rem] border-4 border-slate-800 shadow-2xl overflow-hidden">
                  <canvas ref={canvasRef} width={600} height={200} className="cursor-crosshair touch-none w-full" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
                  <button onClick={clearSignature} className="absolute top-4 right-4 p-2 bg-slate-100 text-slate-400 hover:text-red-500 rounded-lg transition-all shadow-md"><Trash2 size={16} /></button>
                </div>
              </div>
              <button 
                disabled={!signatureData || isSubmitting || !!event.contractUrl} 
                onClick={handleSignContract} 
                className="w-full py-7 bg-blue-600 text-white rounded-[2.5rem] font-black text-xl hover:bg-blue-500 transition-all shadow-2xl disabled:opacity-50 flex items-center justify-center space-x-4"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={28} /> : <CheckCircle2 size={28} />}
                <span>{isSubmitting ? 'Gerando Contrato...' : 'Aceitar Termos e Assinar'}</span>
              </button>
            </div>
          ) : (
             <div className="bg-blue-500/5 border border-blue-500/20 rounded-[2.5rem] p-12 flex flex-col items-center text-center space-y-6">
              <Clock size={32} className="text-blue-500 animate-pulse" />
              <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto">Aguardando a formalização digital pelo contratante.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventContratoWidget;
