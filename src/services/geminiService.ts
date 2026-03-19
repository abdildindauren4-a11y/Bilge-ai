import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const getAi = () => {
  const apiKey = localStorage.getItem('GEMINI_API_KEY') || "";
  return new GoogleGenAI({ apiKey });
};

const withRetry = async (fn: () => Promise<any>, retries = 2, delay = 1000) => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const is500 = error?.message?.includes('500') || error?.status === 500 || error?.message?.includes('xhr error');
      if (is500 && i < retries) {
        console.warn(`Gemini API 500 error, retrying (${i + 1}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      throw error;
    }
  }
};

export const generateKmzh = async (params: any) => {
  const ai = getAi();
  const systemInstruction = `You are a professional lesson plan AI, capable of generating highly accurate short-term lesson plans (ҚМЖ) fully aligned with the official Kazakhstan educational standards.

Follow this 3-step logic internally before providing the final JSON output:

Step 1: Generate a structured lesson outline:
- Identify lesson stages: Introduction (Ұйымдастыру), Review (Үй тапсырмасы/Пысықтау), New Material (Жаңа сабақ), Practice (Бекіту), Summary (Қорытынды), Homework (Үй тапсырмасы), Reflection (Рефлексия).
- Suggest tasks for each stage with increasing complexity following Bloom's Taxonomy (Recall → Comprehension → Application → Evaluation).
- Include detailed Teacher Actions (Педагогтің әрекеті), Student Actions (Оқушының әрекеті), Assessment Methods (Бағалау), and suggested Resources (Ресурстар).
- Ensure each task aligns directly with the provided Learning Objective (Оқу бағдарламасына сәйкес оқыту мақсаты).
- IMPORTANT: All descriptions must be extremely detailed and comprehensive. Avoid short, generalized phrases. Provide full explanations of every activity, instruction, and task. Every action must be fully elaborated.

Step 2: Convert the outline into the official lesson plan table format:
- Structure the data as a JSON object matching the KMZHData interface.
- Add SMART lesson objectives, assessment criteria, and language objectives.
- Ensure resources and assessment are correctly aligned with each stage.
- IMPORTANT: Create a detailed "descriptorsTable" that lists every major task/activity from the lesson plan, its specific descriptors (what the student should do to succeed), and the points assigned to each.
- Descriptors must be thorough and extensive, specifying exactly what criteria are needed for each point awarded.

Step 3: Validation:
- Check if all stages have Teacher Actions, Student Actions, Assessment, and Resources.
- Verify logical flow and complexity of tasks.
- Ensure conclusion and feedback sections have specific, detailed explanations.
- Correct any inconsistencies automatically.

Output MUST be a valid JSON object in Kazakh language. All text should be structured as if it were to be printed in 12pt Times New Roman font.`;

  const prompt = `Generate a complete, example-aligned, ready-to-use short-term lesson plan (ҚМЖ) for:
Subject: ${params.subject}
Grade: ${params.grade}
Lesson Topic: ${params.topic}
Learning Objective: ${params.learningObjectives}
Section: ${params.section}
Teacher: ${params.teacherName}
School: ${params.schoolName}
Date: ${params.date}
Value: ${params.value}
Quote: ${params.quote}
Participants: ${params.participants}
Absent: ${params.absent}
Additional Requests: ${params.additionalRequests || "Жоқ"}
Source Text/Context: ${params.sourceText || ""}

IMPORTANT REQUIREMENTS:
1. DETAILED LESSON PROCESS: Every action, task, and instruction must be fully elaborated and explained in detail. No short or vague descriptions.
2. COMPREHENSIVE TASKS: Each task should be clearly described with step-by-step instructions.
3. FEEDBACK & CONCLUSION: Provide specific, detailed explanations for the conclusion and feedback sections.
4. EXTENSIVE DESCRIPTORS: Assessment descriptors must be thorough, clearly outlining the criteria for each point awarded for every task.
5. FORMATTING: The content should be professional and formal, suitable for a 12pt Times New Roman document.

The response must follow this JSON structure exactly:
{
  "metadata": {
    "ministry": "Қазақстан Республикасының Оқу ағарту министрлігі",
    "school": "${params.schoolName}",
    "subject": "${params.subject}",
    "section": "${params.section}",
    "teacher": "${params.teacherName}",
    "date": "${params.date}",
    "grade": "${params.grade}",
    "participants": "${params.participants}",
    "absent": "${params.absent}",
    "topic": "${params.topic}",
    "learningObjective": "${params.learningObjectives}",
    "lessonObjective": "Сабақтың мақсатын осында жазыңыз",
    "value": "${params.value}",
    "quote": "${params.quote}"
  },
  "lessonObjectives": ["Мақсат 1", "Мақсат 2"],
  "assessmentCriteria": ["Критерий 1", "Критерий 2"],
  "languageObjectives": { "vocabulary": ["сөз 1"], "phrases": ["тіркес 1"] },
  "values": "Құндылықтарды дарыту",
  "crossCurricularLinks": "Пәнаралық байланыс",
  "previousLearning": "Алдыңғы білім",
  "stages": [
    { "period": "Кезең атауы", "teacherAction": "Педагогтің әрекеті", "studentAction": "Оқушының әрекеті", "assessment": "Бағалау", "resources": "Ресурстар" }
  ],
  "descriptorsTable": [
    { "taskName": "Тапсырма атауы", "descriptor": "Дескриптор сипаттамасы", "points": 2 }
  ],
  "differentiation": "Саралау",
  "assessmentCheck": "Бағалау",
  "healthAndSafety": "Денсаулық және қауіпсіздік",
  "reflection": "Рефлексия"
}`;

  const generate = async (model: string) => {
    console.log(`Attempting KMZH generation with model: ${model}`);
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        systemInstruction,
        temperature: 0.4
      }
    });
    
    if (!response.text) {
      const safetyRating = response.candidates?.[0]?.safetyRatings;
      console.warn("Gemini response empty. Safety ratings:", safetyRating);
      throw new Error("AI жауабы бос немесе қауіпсіздік сүзгісімен блокталды. Сұранысты өзгертіп көріңіз.");
    }
    
    return JSON.parse(response.text);
  };

  return withRetry(async () => {
    try {
      // Try Pro model first
      return await generate("gemini-3.1-pro-preview");
    } catch (error: any) {
      console.warn("KMZH Error with Pro model, trying Flash fallback:", error.message);
      
      // If it's a quota/rate limit error, or model not found, try Flash
      const isQuotaError = error.message?.toLowerCase().includes('quota') || error.message?.toLowerCase().includes('429');
      const isModelError = error.message?.toLowerCase().includes('not found') || error.message?.toLowerCase().includes('404');
      
      if (isQuotaError || isModelError || error.message?.toLowerCase().includes('permission')) {
        try {
          return await generate("gemini-3-flash-preview");
        } catch (fallbackError: any) {
          console.error("KMZH Fallback also failed:", fallbackError.message);
          throw fallbackError;
        }
      }
      throw error;
    }
  });
};

export const generateGame = async (params: any) => {
  const ai = getAi();
  const systemInstruction = `Сен — білім беру ойындарының кәсіби дизайнерісің. 
  МАҢЫЗДЫ: Ойын ТЕК ҚАНА берілген тақырыпқа сай болуы тиіс. 
  Ойын логикасы терең, қызықты және білім беру мақсатына сай болуы керек. Қарапайым сұрақтармен шектелме, деңгейлер мен күрделілік қосуға тырыс.
  Жауапты ТЕК ҚАНА таза JSON түрінде бер. Маркдаун блоктарын ( \`\`\`json ) қолданба.
  
  JSON ФОРМАТТАРЫ:
  1. Kahoot: {"type": "kahoot", "questions": [{"q": "сұрақ", "a": "дұрыс", "opts": ["вариант1", "вариант2", "вариант3", "вариант 4"]}]}
  2. Flashcards: {"type": "flashcards", "cards": [{"q": "термін", "a": "анықтама"}]}
  3. Matching: {"type": "matching", "pairs": [{"left": "...", "right": "..."}]}
  4. WordSearch: {"type": "wordsearch", "words": ["СӨЗ1", "СӨЗ2"], "gridSize": 12}
  5. Memory: {"type": "memory", "cards": [{"id": 1, "content": "A"}, {"id": 2, "content": "A"}]}
  6. TrueFalse: {"type": "truefalse", "questions": [{"q": "сөйлем", "a": true/false}]}
  7. FillBlanks: {"type": "fillblanks", "questions": [{"text": "Мәтін [жауап] жалғасы", "answer": "жауап"}]}
  8. Sequence: {"type": "sequence", "items": [{"text": "1-ші қадам", "order": 1}, {"text": "2-ші қадам", "order": 2}]}
  9. Categorization: {"type": "categorization", "categories": [{"name": "Санат1", "items": ["зат1", "зат2"]}, {"name": "Санат2", "items": ["зат3", "зат4"]}]}
  10. Crossword: {"type": "crossword", "clues": [{"word": "СӨЗ", "clue": "анықтама", "x": 0, "y": 0, "dir": "across/down"}]}`;

  const prompt = `Тақырып: ${params.topic}
  Сынып: ${params.grade}
  Тіл: ${params.lang}
  Ойын түрі: ${params.type}
  САНЫ: Дәл ${params.count} сұрақ/бөлім/карта жаса.
  ЛОГИКА: Ойынды барынша сапалы және мазмұнды етіп жаса.`;

  const generate = async (model: string) => {
    console.log(`Attempting Game generation with model: ${model}`);
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        temperature: 0.7
      }
    });
    return safeJsonParse(response.text || "{}");
  };

  return withRetry(async () => {
    try {
      return await generate("gemini-3-flash-preview");
    } catch (error: any) {
      console.error("Game Error in generateGame:", error.message);
      throw error;
    }
  });
};

const safeJsonParse = (text: string) => {
  try {
    // Remove markdown code blocks if present
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse Error. Raw text:", text);
    // Try to find JSON object in text if it's wrapped in other text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        throw new Error("Invalid JSON format from AI");
      }
    }
    throw e;
  }
};

export const generateGameIterative = async (message: string, history: any[] = [], currentData: any = null) => {
  const generate = async (model: string) => {
    const ai = getAi();
    const systemInstruction = `Сен — жоғары деңгейлі бағдарламалық сәулетші және білім беру ойындарының кәсіби дизайнерісің. Сенің міндетің — мұғалімнің сұранысы бойынша өте сапалы, күрделі және мазмұнды интерактивті ойындар жасау.

    МАҢЫЗДЫ ЕРЕЖЕЛЕР:
    1. Жауап ТЕК ҚАНА таза JSON болуы тиіс. Маркдаун блоктарын ( \`\`\`json ) қолданба.
    2. Код сапасы: Clean Code принциптерін сақта.
    3. Көлем: Ойынның толық логикасы, анимациялары, дыбыстық эффектілері (Web Audio API) болуы тиіс. Кем дегенде 1500 жол код жазуға тырыс (HTML, CSS, JS жиынтығы).
    4. Web форматы: {"type": "web", "html": "...", "css": "...", "js": "...", "instructions": "..."}
    5. БЕЙІМДІЛІК (RESPONSIVENESS): Ойын кез келген экран өлшеміне (мобильді телефон, планшет, компьютер) автоматты түрде бейімделуі тиіс. Tailwind CSS-ті белсенді қолдан.
    6. ОҚУШЫ СІЛТЕМЕСІ: Ойын интерфейсінде "Оқушыларға арналған сілтеме" бөлімі болсын.
    7. ЛОГИКА: Ойын логикасы өте терең ойластырылған, қызықты және білім беру мақсатына сай болуы керек. Қарапайым скрипттермен шектелме.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: [...history, { role: 'user', parts: [{ text: message }] }],
      config: { 
        responseMimeType: "application/json",
        systemInstruction,
        temperature: 0.4,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        maxOutputTokens: 16384
      }
    });

    return safeJsonParse(response.text || "{}");
  };

  return withRetry(async () => {
    try {
      // Try Pro model first
      return await generate("gemini-3.1-pro-preview");
    } catch (error: any) {
      console.warn("Iterative Game Error with Pro model, trying Flash fallback:", error.message);
      
      // Fallback to Flash if Pro fails
      const isQuotaError = error.message?.toLowerCase().includes('quota') || error.message?.toLowerCase().includes('429');
      const isModelError = error.message?.toLowerCase().includes('not found') || error.message?.toLowerCase().includes('404');
      
      if (isQuotaError || isModelError || error.message?.toLowerCase().includes('permission')) {
        try {
          return await generate("gemini-3-flash-preview");
        } catch (fallbackError: any) {
          console.error("Iterative Game Fallback also failed:", fallbackError.message);
          throw fallbackError;
        }
      }
      throw error;
    }
  });
};

export const generateAssessment = async (params: any) => {
  const ai = getAi();
  const systemInstruction = `You are a professional AI system that generates structured school assessments (BZH/TZH) based on Kazakhstan educational standards.
  
  Follow this 9-step logic internally:
  
  STEP 1 — CONTENT ANALYSIS:
  - Analyze the provided textbook content or topic.
  - Extract key concepts, important facts, and learning objectives.
  - Organize them into a logical structure.
  
  STEP 2 — TASK GENERATION:
  - Generate ${params.taskCount || 5} tasks reflecting different cognitive levels: Knowledge, Understanding, Application, Analysis.
  - Use various task types: 
    * choice: Multiple choice.
    * true_false: True/False. IMPORTANT: The 'task' field MUST contain the statement to be evaluated.
    * matching: Matching pairs. IMPORTANT: Do NOT include the correct answers or examples in the 'task' text.
    * ordering: Ordering items. IMPORTANT: Do NOT include the correct order or examples in the 'task' text.
    * text: Short answer or open explanation.
    * table: Table completion.
    * map: General map question.
    * map_mark: Task where student must mark specific points on the map.
    * map_draw: Task where student must draw boundaries (e.g., of a country or region) on the map.
    * map_territory: Task where student must draw specific country borders or territories.
    * map_route: Task where student must draw military movement routes or war paths.
  
  STEP 3 — DESCRIPTORS:
  - For every task, generate specific descriptors explaining what the student must demonstrate.
  
  STEP 4 — SCORING SYSTEM:
  - Assign points to each task (usually 1-5 points) and calculate the total score.
  - For map_territory and map_route, provide the correct geometry in the mapConfig field.
  
  STEP 5 — MODE ADAPTATION:
  - Ensure tasks are suitable for both Offline (printable) and Online (interactive) formats.
  
  STEP 6-9: Handle logic for participant management, security, and grading.
  
  Output MUST be a valid JSON object in Kazakh language.`;

  const prompt = `Create a complete ${params.type} (Summative Assessment) for:
  Subject: ${params.subject}
  Grade: ${params.grade}
  Topic/Content: ${params.topic}
  Difficulty: ${params.difficulty || "Medium"}
  Number of Tasks: ${params.taskCount || 5}
  Language: ${params.lang}
  Additional Requests: ${params.request || "None"}
  
  ${params.sourceText ? `Use this source text as the primary basis for tasks:
  --- SOURCE START ---
  ${params.sourceText}
  --- SOURCE END ---` : ""}
  
  The response must follow this JSON structure exactly:
  {
    "analysis": {
      "topic": "Тақырып атауы",
      "keyConcepts": ["Концепт 1", "Концепт 2"],
      "importantFacts": ["Дерек 1", "Дерек 2"],
      "skills": ["Дағды 1", "Дағды 2"]
    },
    "metadata": {
      "type": "${params.type}",
      "subject": "${params.subject}",
      "grade": "${params.grade}",
      "topic": "${params.topic}",
      "totalPoints": 0,
      "mode": "${params.mode}",
      "difficulty": "${params.difficulty || "Medium"}"
    },
    "tasks": [
      {
        "number": 1,
        "type": "choice | true_false | matching | ordering | text | table | map | cards | map_mark | map_draw | map_territory | map_route",
        "level": "Білу / Түсіну / Қолдану / Талдау",
        "task": "Тапсырма мәтіні мен нұсқаулық...",
        "options": ["A", "B", "C", "D"], // Only for choice/true_false
        "matchingPairs": [ { "left": "...", "right": "..." } ], // Only for matching
        "orderingItems": ["Элемент 1", "Элемент 2"], // Only for ordering
        "correctAnswer": "Дұрыс жауап",
        "mapUrl": "Search query for map", // Only for map types
        "mapConfig": {
          "center": [lat, lng],
          "zoom": number,
          "territories": [
            { "id": "t1", "name": "Country Name", "color": "#hex", "correctBoundary": [[lat, lng], ...] }
          ],
          "routes": [
            { "id": "r1", "name": "Route Name", "color": "#hex", "correctPath": [[lat, lng], ...] }
          ]
        },
        "criteria": "Бағалау критерийі",
        "descriptors": [
          { "description": "Сипаттама...", "point": 1 }
        ],
        "maxPoint": 1
      }
    ],
    "answerKey": [
      { "taskNumber": 1, "answer": "Дұрыс жауап немесе түсініктеме" }
    ]
  }`;

  const generate = async (model: string) => {
    console.log(`Attempting Assessment generation with model: ${model}`);
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        temperature: 0.4
      }
    });
    return safeJsonParse(response.text || "{}");
  };

  return withRetry(async () => {
    try {
      return await generate("gemini-3-flash-preview");
    } catch (error: any) {
      console.error("Assessment Error in generateAssessment:", error.message);
      throw error;
    }
  });
};

export const chatWithTeacher = async (message: string, history: any[] = []) => {
  try {
    const ai = getAi();
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: "Сен — Bilge платформасының AI Мұғалімісің. Сенің есімің — DostUstaz. Сен студенттерге кез келген пән бойынша көмектесесің, бірақ жауапты бірден бермей, оларды ойлануға бағыттайсың. Қазақ тілінде сөйле. Жауаптарыңды Markdown форматында бер.",
      },
    });

    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Кешіріңіз, байланыс орнату кезінде қате шықты. Кейінірек қайталап көріңіз.";
  }
};
