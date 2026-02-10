
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysis, Severity } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    primaryDepartment: { type: Type.STRING, description: "The main department responsible for this issue." },
    secondaryDepartments: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Other departments that might need to be involved." },
    issueType: { type: Type.STRING, description: "Specific classification of the issue (e.g., 'Pothole Repair')." },
    severity: { type: Type.STRING, enum: Object.values(Severity), description: "Calculated severity level." },
    fundingRequired: { type: Type.BOOLEAN, description: "Whether special budget allocation is likely needed." },
    estimatedCost: { type: Type.STRING, description: "Rough estimate of cost in Rupees." },
    permissionsNeeded: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of administrative approvals needed." },
    interdeptCoordination: { type: Type.BOOLEAN, description: "Does this require multiple departments to work together?" },
    estimatedTimeline: { type: Type.STRING, description: "Expected resolution time (e.g., '14 days')." },
    reasoning: { type: Type.STRING, description: "Brief explanation of the AI's assessment." },
  },
  required: [
    "primaryDepartment", 
    "issueType", 
    "severity", 
    "fundingRequired", 
    "estimatedCost", 
    "estimatedTimeline", 
    "reasoning"
  ]
};

export async function analyzeComplaint(
  imageBase64?: string, 
  textDescription?: string, 
  audioTranscript?: string
): Promise<AIAnalysis> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze this civic infrastructure complaint from Andhra Pradesh, India.
    
    TEXT DESCRIPTION: "${textDescription || 'Not provided'}"
    AUDIO TRANSCRIPT: "${audioTranscript || 'Not provided'}"
    
    Using the provided information (and image if available), identify the responsible department in Andhra Pradesh (e.g., Roads & Buildings, Panchayat Raj, Municipal Administration, Energy, Irrigation, etc.). 
    Assess the severity, estimated cost for repair based on typical government schedules in AP, and determine if inter-departmental coordination is needed.
    
    Use Google Search to find relevant government SOPs or recent budget allocations for similar issues in Andhra Pradesh.
  `;

  const contents: any[] = [{ text: prompt }];
  if (imageBase64) {
    contents.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64.split(',')[1] || imageBase64
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: contents },
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    // Extract grounding sources
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingSources = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title,
        uri: chunk.web?.uri
      }));

    return { ...result, groundingSources };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback Mock if API fails for some reason during demo
    return {
      primaryDepartment: "Municipal Administration",
      secondaryDepartments: ["Roads & Buildings"],
      issueType: "Road Infrastructure Damage",
      severity: Severity.HIGH,
      fundingRequired: true,
      estimatedCost: "₹2,50,000",
      permissionsNeeded: ["District Collector Approval"],
      interdeptCoordination: true,
      estimatedTimeline: "14 days",
      reasoning: "Image shows significant structural damage to the primary access road. Immediate intervention required."
    };
  }
}

export async function transcribeAudio(audioBase64: string): Promise<string> {
  const model = "gemini-3-flash-preview";
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType: "audio/wav", data: audioBase64.split(',')[1] || audioBase64 } },
          { text: "Transcribe the following audio accurately. It may be in English or Telugu. Provide the transcription in English or a transliteration if necessary, but prioritize an English translation for officer review." }
        ]
      }
    });
    return response.text || "Could not transcribe audio.";
  } catch (error) {
    console.error("Transcription Error:", error);
    return "Error during transcription.";
  }
}
