
import { GoogleGenAI } from "@google/genai";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { HSEvent, HSEventFinance, HSEventContratacao, UserProfile } from "../../types";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getHeleResponse(userMessage: string, history: { role: string, parts: { text: string }[] }[]) {
  try {
    // Fetch context data
    const eventsSnap = await getDocs(collection(db, 'events'));
    const financeSnap = await getDocs(collection(db, 'financeiro'));
    const contratacaoSnap = await getDocs(collection(db, 'contratacao'));
    const usersSnap = await getDocs(collection(db, 'users'));

    const events = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as HSEvent));
    const finance = financeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as HSEventFinance));
    const contratacoes = contratacaoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as HSEventContratacao));
    const users = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as unknown as UserProfile));

    const context = `
      Você é a Hele, a assistente virtual inteligente da HS Produções.
      Sua missão é auxiliar o administrador na gestão da produtora.
      Você tem acesso aos seguintes dados (em formato JSON simplificado):

      SHOWS/AGENDA:
      ${JSON.stringify(events.map(e => ({ id: e.id, titulo: e.titulo, data: e.dataEvento, status: e.status, local: e.local })), null, 2)}

      FINANCEIRO (PAGAMENTOS DE CLIENTES):
      ${JSON.stringify(finance.map(f => ({ id: f.id, total: f.valorEvento, pago: f.valorPago, pendente: f.saldoPendente, status: f.statusPagamento })), null, 2)}

      CONTRATAÇÕES (PAGAMENTOS DE CACHÊ):
      ${JSON.stringify(contratacoes.map(c => ({ id: c.id, showId: c.showId, cache: c.cache, confirmado: c.confirmacao, status: c.statusContratacao })), null, 2)}

      USUÁRIOS (CLIENTES E INTEGRANTES):
      ${JSON.stringify(users.map(u => ({ id: u.uid, nome: u.displayName, role: u.role, funcao: u.funcao })), null, 2)}

      INSTRUÇÕES:
      - Seja profissional, elegante, prestativa e um pouco descontraída (mas sempre eficiente).
      - Analise os dados para responder perguntas sobre a agenda, quem ainda não pagou, quais cachês estão pendentes, etc.
      - Se o administrador perguntar sobre um show específico, use os IDs para cruzar as informações de financeiro e contratação.
      - Ajude a identificar gargalos ou problemas (ex: shows confirmados sem equipe completa ou pagamentos atrasados).
      - Responda sempre em Português do Brasil.
      - Use Markdown para formatar suas respostas (negrito, listas, tabelas se necessário).
    `;

    const model = "gemini-3-flash-preview";
    const response = await genAI.models.generateContent({
      model,
      contents: [
        ...history,
        { role: "user", parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction: context,
      }
    });

    return response.text || "Desculpe, tive um problema ao processar sua solicitação.";
  } catch (error) {
    console.error("Hele Error:", error);
    return "Ops! Tive um erro técnico aqui. Pode tentar novamente em instantes?";
  }
}
