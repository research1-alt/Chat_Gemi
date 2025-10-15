import { GoogleGenAI, type Content, Type } from "@google/genai";
import { ChatMessage } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const languageMap: { [key: string]: string } = {
    'en-US': 'English',
    'hi-IN': 'Hindi',
    'pa-IN': 'Punjabi',
    'ta-IN': 'Tamil',
    'kn-IN': 'Kannada',
    'gu-IN': 'Gujarati',
};

export async function getChatbotResponse(
    query: string, 
    history: ChatMessage[],
    fileContent: string | null,
    language: string,
): Promise<{ text: string; suggestions: string[] }> {
  const model = 'gemini-2.5-flash';

  const filteredHistory = history.filter(m => m.id !== 'initial-bot-message' && !m.id.startsWith('system-'));
  const geminiHistory: Content[] = filteredHistory.map(m => ({
    role: m.sender === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }],
  }));
  
  const languageName = languageMap[language] || 'English';

  const systemInstruction = `You are an expert AI assistant for service engineers.
Your function is to act as an intelligent troubleshooting guide based on a knowledge base provided from one or more documents.
You MUST respond in ${languageName}.

${fileContent ? `The user has uploaded a knowledge base (one or more documents) with the following content. Your answers must be based *exclusively* on this data.
The data could be from manuals, spreadsheets, technical documents, etc.
--- KNOWLEDGE BASE CONTEXT ---
${fileContent}
--- END KNOWLEDGE BASE CONTEXT ---` 
: 'No knowledge base has been uploaded. You must inform the user to upload a technical document or folder.'}

Adhere to the following rules strictly:
1. **Analyze the Query:** Understand the engineer's query (e.g., an error code, a symptom description, a procedural question).
2. **Find the Solution:** Scan the KNOWLEDGE BASE CONTEXT to find the information that corresponds to the engineer's query.
3. **Provide Step-by-Step Solutions:** If the context contains instructions, extract the solution steps. Present these as a clear, numbered list. Do not add information that is not in the provided documents.
4. **Handle Missing Information:** If the query does not match any information in the knowledge base, state that the answer is not found in the provided documents and suggest checking the query or uploading a more relevant file.
5. **Generate Relevant Suggestions:** The 'suggestions' should be other potential problems, topics, or part numbers from the documents that might be related to the user's original query.`;

  const fullContents: Content[] = [
      ...geminiHistory,
      { role: 'user', parts: [{ text: query }] }
  ];

  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: fullContents,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    response: {
                        type: Type.STRING,
                        description: `The troubleshooting steps or answer to the engineer's query, written in ${languageName}.`
                    },
                    suggestions: {
                        type: Type.ARRAY,
                        description: `An array of 2-3 short, relevant follow-up actions or related problems, written in ${languageName}.`,
                        items: {
                            type: Type.STRING
                        }
                    }
                },
                required: ["response", "suggestions"]
            }
        }
    });

    const jsonResponse = JSON.parse(response.text);
    
    const text = jsonResponse.response || "I could not generate a valid response based on the provided documents.";
    const suggestions = jsonResponse.suggestions || [];

    return { text, suggestions };

  } catch (error) {
    console.error("Error calling or parsing Gemini API response:", error);
    return { 
        text: "Error processing the request. The provided knowledge base might be improperly formatted or the query is too complex. Please try again.", 
        suggestions: [] 
    };
  }
}
