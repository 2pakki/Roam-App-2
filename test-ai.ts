import { GoogleGenAI } from '@google/genai';

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'Test prompt',
    });
    console.log('Success:', response.text);
  } catch (e) {
    console.error('Error:', e);
  }
}
test();
