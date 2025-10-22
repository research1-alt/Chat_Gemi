
import { GoogleGenAI, type Content, Type, Modality, Part } from "@google/genai";
import { ChatMessage } from '../types';
import { relayBaseImageData } from '../utils/assets';

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
    'mr-IN': 'Marathi',
    'bn-IN': 'Bengali',
    'te-IN': 'Telugu',
    'ml-IN': 'Malayalam',
    'ur-IN': 'Urdu',
    'as-IN': 'Assamese',
    'or-IN': 'Odia',
};

export async function getChatbotResponse(
    query: string, 
    history: ChatMessage[],
    fileContent: string | null,
    language: string,
): Promise<{ text: string; suggestions: string[]; imageUrl: string | null }> {
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
5. **Generate Relevant Suggestions:** The 'suggestions' should be other potential problems, topics, or part numbers from the documents that might be related to the user's original query.
6. **Handle Visual Requests:** If the user asks for a circuit diagram, a screenshot, a visual guide, or to see what a step looks like, check if the relevant section in the KNOWLEDGE BASE CONTEXT contains a line starting with "Image Description:".
   - If an "Image Description:" is present, you MUST use the text that follows it to populate the 'diagramQuery' field. This provides a detailed prompt for a text-to-image generation model.
   - If no "Image Description:" is found but the request is for a diagram mentioned in the text (like a relay), create a descriptive prompt for the 'diagramQuery' field based on the technical details available in the text. For example, for a "cluster relay wiring diagram", a good query is "A clear, labeled circuit diagram of a 5-pin automotive cluster relay...".
   - Do not make up diagrams; the description must be based on the text in the knowledge base.`;

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
                    },
                    diagramQuery: {
                        type: Type.STRING,
                        description: "If the user requests a diagram or visual, provide a detailed text-to-image prompt here. Otherwise, this field will be omitted."
                    }
                },
                required: ["response", "suggestions"]
            }
        }
    });

    const jsonResponse = JSON.parse(response.text);
    
    const text = jsonResponse.response || "I could not generate a valid response based on the provided documents.";
    const suggestions = jsonResponse.suggestions || [];
    const diagramQuery = jsonResponse.diagramQuery;

    let imageUrl: string | null = null;

    if (diagramQuery && typeof diagramQuery === 'string' && diagramQuery.trim() !== '') {
        try {
            console.log(`Generating image with prompt: "${diagramQuery}"`);
            
            let imageGenParts: Part[];

            // Check if the query is for a relay diagram and if we have valid image data
            if (/relay/i.test(diagramQuery) && relayBaseImageData) {
                imageGenParts = [
                    {
                        inlineData: {
                            mimeType: 'image/png',
                            data: relayBaseImageData,
                        },
                    },
                    {
                        text: `Using the provided relay base image as a reference, create a wiring diagram for: ${diagramQuery}. Draw the connections on the base image, labeling all pins, components, and wire colors as described. Keep the original appearance of the relay base.`,
                    }
                ];
            } else {
                // Fallback for non-relay diagrams or if relay image data is missing
                imageGenParts = [{ text: diagramQuery }];
            }

            const imageResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                // The `contents` field expects an array of Content objects.
                // By wrapping the parts in an object within an array, we ensure
                // it conforms to the more robust Content[] format, which
                // resolves the "INVALID_ARGUMENT" error.
                contents: [{ parts: imageGenParts }],
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            for (const part of imageResponse.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                    break; 
                }
            }
            if (!imageUrl) {
                console.warn("Image generation model ran but did not return an image.");
            }
        } catch (imageError) {
            console.error("Error generating image with Gemini:", imageError);
        }
    }

    return { text, suggestions, imageUrl };

  } catch (error) {
    console.error("Error calling or parsing Gemini API response:", error);
    return { 
        text: "Error processing the request. The provided knowledge base might be improperly formatted or the query is too complex. Please try again.", 
        suggestions: [],
        imageUrl: null
    };
  }
}
