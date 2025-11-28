import { GoogleGenAI, FunctionDeclaration, Type, Tool, Part, FunctionResponse } from "@google/genai";
import { VitalsData } from "../types";

// ===== TOOL DEFINITIONS =====
const checkVitalsTool: FunctionDeclaration = {
  name: "checkVitals",
  description: "Checks the patient's current real-time vital signs.",
  parameters: {
    type: Type.OBJECT,
    properties: {}
  }
};

const searchMedicalDatabaseTool: FunctionDeclaration = {
  name: "searchMedicalDatabase",
  description: "Searches the internal medical database.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "Medical symptom or term"
      }
    },
    required: ["query"]
  }
};

const scheduleAppointmentTool: FunctionDeclaration = {
  name: "scheduleAppointment",
  description: "Schedules an appointment.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      department: { type: Type.STRING },
      urgency: { type: Type.STRING }
    },
    required: ["department"]
  }
};

const tools: Tool[] = [
  {
    functionDeclarations: [
      checkVitalsTool,
      searchMedicalDatabaseTool,
      scheduleAppointmentTool
    ]
  }
];

// === MOCK VITALS ===
export const generateMockVitals = (): VitalsData => {
  const hr = 60 + Math.floor(Math.random() * 40);
  const sys = 110 + Math.floor(Math.random() * 30);
  const dia = 70 + Math.floor(Math.random() * 20);

  return {
    heartRate: hr,
    bloodPressure: `${sys}/${dia}`,
    oxygenLevel: 95 + Math.floor(Math.random() * 5),
    temperature: 36.5 + Math.random(),
    status: hr > 110 || sys > 140 ? "Warning" : "Normal"
  };
};

// ===== CHAT ENGINE =====
let chatSession: any = null;

export const initializeChat = (apiKey: string) => {
  if (!apiKey) throw new Error("API Key is missing");
  const ai = new GoogleGenAI({ apiKey });

  chatSession = ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: `
        You are NURA, an advanced 3D Agentic AI Nurse.
        You monitor vitals, give safe info, and run tools.
        If symptoms are severe, warn about emergencies.
        Keep responses concise and helpful.
        When using tools, wait for the result before summarizing.
      `,
      tools: tools
    }
  });

  return chatSession;
};

// ===== SEND MESSAGE =====
export const sendMessageToGemini = async (
  message: string,
  onToolCall: (toolName: string, args: any) => Promise<any>
): Promise<string> => {

  if (!chatSession) throw new Error("Chat session not initialized.");

  try {
    // STEP 1: Send the user's text message
    // Using object syntax { message: ... } to be strict with SDK types
    let response = await chatSession.sendMessage({ message });

    // STEP 2: Agentic Loop - Process any function calls returned by the model
    while (true) {
      const parts = response.candidates?.[0]?.content?.parts;
      if (!parts) break;

      // Extract function calls from the response parts
      const functionCalls = parts
        .filter((p: any) => p.functionCall)
        .map((p: any) => p.functionCall);
      
      // If no function calls, the model is done thinking
      if (functionCalls.length === 0) {
        break;
      }

      const replyParts: Part[] = [];

      // Execute each tool requested by the model
      for (const call of functionCalls) {
        if (!call.name) continue;
        
        console.log(`[Gemini Service] Tool Call: ${call.name}`);
        
        let result;
        try {
          result = await onToolCall(call.name, call.args || {});
        } catch (error: any) {
          console.error(`Tool execution error for ${call.name}:`, error);
          result = { error: error.message || "Tool execution failed" };
        }

        // Construct the FunctionResponse part strictly
        const functionResponsePart: FunctionResponse = {
            name: call.name,
            response: result || { result: "ok" } 
        };

        // Only add 'id' if the original call had one (strict requirement)
        if (call.id) {
            functionResponsePart.id = call.id;
        }

        replyParts.push({ functionResponse: functionResponsePart });
      }

      // STEP 3: Send the tool results back to the model
      if (replyParts.length > 0) {
        // We pass the array of function responses as the 'message'
        response = await chatSession.sendMessage({ message: replyParts });
      } else {
        break;
      }
    }

    return response.text || "I have completed the task.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};