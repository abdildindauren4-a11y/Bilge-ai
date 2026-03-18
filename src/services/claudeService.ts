import Anthropic from '@anthropic-ai/sdk';

const getClaude = () => {
  const apiKey = localStorage.getItem('CLAUDE_API_KEY') || "";
  return new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true // Since we are calling from the frontend
  });
};

export const generateGameWithClaude = async (message: string, history: any[] = [], currentData: any = null) => {
  const anthropic = getClaude();
  
  const systemInstruction = `Сен — жоғары деңгейлі бағдарламалық сәулетші және білім беру ойындарының кәсіби дизайнерісің. Сенің міндетің — мұғалімнің сұранысы бойынша өте сапалы, күрделі және мазмұнды интерактивті ойындар жасау.

  МАҢЫЗДЫ ЕРЕЖЕЛЕР:
  1. Жауап ТЕК ҚАНА таза JSON болуы тиіс. Маркдаун блоктарын ( \`\`\`json ) қолданба.
  2. Код сапасы: Clean Code принциптерін сақта.
  3. Көлем: Ойынның толық логикасы, анимациялары, дыбыстық эффектілері (Web Audio API) болуы тиіс.
  4. Web форматы: {"type": "web", "html": "...", "css": "...", "js": "...", "instructions": "..."}
  5. БЕЙІМДІЛІК (RESPONSIVENESS): Ойын кез келген экран өлшеміне (мобильді телефон, планшет, компьютер) автоматты түрде бейімделуі тиіс. Tailwind CSS-ті белсенді қолдан.
  6. ОҚУШЫ СІЛТЕМЕСІ: Ойын интерфейсінде "Оқушыларға арналған сілтеме" бөлімі болсын.`;

  // Convert Gemini history format to Claude format
  const claudeMessages: any[] = history.map(m => ({
    role: m.role === 'model' ? 'assistant' : 'user',
    content: m.parts[0].text
  }));

  claudeMessages.push({
    role: 'user',
    content: message
  });

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-latest",
    max_tokens: 8192,
    system: systemInstruction,
    messages: claudeMessages,
    temperature: 0.4,
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  
  try {
    // Remove markdown code blocks if present
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Claude JSON Parse Error. Raw text:", text);
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        throw new Error("Invalid JSON format from Claude");
      }
    }
    throw new Error("Claude returned invalid JSON");
  }
};
