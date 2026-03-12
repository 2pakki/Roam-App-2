import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

const HARDCODED_EVENTS = [
  {
    id: '1',
    eventName: 'Grand Sadhya at Mothers Veg Plaza',
    description: 'Experience the authentic Kerala Sadhya with 28+ items served on a banana leaf.',
    location: 'Bakery Junction, Trivandrum',
    imageUrl: '/mothers_veg_plaza.jpg',
    eventVector: { Music: 0.0, Food: 1.0, Art: 0.2, Tech: 0.0, Outdoor: 0.0, Nightlife: 0.0, Luxury: 0.3 }
  },
  {
    id: '2',
    eventName: 'AI & Web3 Developers Meetup',
    description: 'A networking event and tech talk for local developers and startup founders.',
    location: 'Technopark Phase 3',
    imageUrl: '/technopark_phase3.jpg',
    eventVector: { Music: 0.0, Food: 0.2, Art: 0.0, Tech: 1.0, Outdoor: 0.0, Nightlife: 0.0, Luxury: 0.1 }
  },
  {
    id: '3',
    eventName: 'Indie Music Fest at Kanakakkunnu',
    description: 'Live performances by local indie bands in the beautiful palace grounds.',
    location: 'Kanakakkunnu Palace Grounds',
    imageUrl: '/Kanakakkunnu-palace-trivandrum.jpg',
    eventVector: { Music: 1.0, Food: 0.4, Art: 0.6, Tech: 0.0, Outdoor: 0.9, Nightlife: 0.5, Luxury: 0.2 }
  },
  {
    id: '4',
    eventName: 'Full Moon Party at Kovalam',
    description: 'Beachside DJ, fire dancers, and cocktails under the stars.',
    location: 'Kovalam Beach',
    imageUrl: '/kovalam_beach.jpg',
    eventVector: { Music: 0.8, Food: 0.5, Art: 0.3, Tech: 0.0, Outdoor: 0.9, Nightlife: 1.0, Luxury: 0.6 }
  },
  {
    id: '5',
    eventName: 'Contemporary Art Exhibition',
    description: 'Showcasing modern sculptures and paintings from Kerala artists.',
    location: 'Napier Museum Art Gallery',
    imageUrl: '/Napier_Museum_TVM.jpg',
    eventVector: { Music: 0.1, Food: 0.0, Art: 1.0, Tech: 0.0, Outdoor: 0.4, Nightlife: 0.0, Luxury: 0.5 }
  },
  {
    id: '6',
    eventName: 'Trivandrum Marathon 2026',
    description: 'Join thousands of runners for the annual city marathon. Includes 5k, 10k, and Half Marathon categories.',
    location: 'Manaveeyam Veedhi',
    imageUrl: '/manaveeyam_veedhi.jpg',
    eventVector: { Music: 0.1, Food: 0.2, Art: 0.0, Tech: 0.0, Outdoor: 1.0, Nightlife: 0.0, Luxury: 0.0 }
  },
  {
    id: '7',
    eventName: 'Luxury Yacht Sunset Cruise',
    description: 'An exclusive evening on a private yacht with premium dining and live acoustic music.',
    location: 'Veli Tourist Village',
    imageUrl: '/veli_tourist_village.jpg',
    eventVector: { Music: 0.6, Food: 0.8, Art: 0.2, Tech: 0.0, Outdoor: 0.7, Nightlife: 0.8, Luxury: 1.0 }
  },
  {
    id: '8',
    eventName: 'Street Food Festival',
    description: 'Taste the best street food from across India, featuring over 50 pop-up stalls.',
    location: 'Shangumugham Beach',
    imageUrl: '/shankumugham.jpg',
    eventVector: { Music: 0.3, Food: 1.0, Art: 0.1, Tech: 0.0, Outdoor: 0.8, Nightlife: 0.6, Luxury: 0.0 }
  },
  {
    id: '9',
    eventName: 'Cybersecurity Workshop',
    description: 'Hands-on workshop on ethical hacking and network security for professionals.',
    location: 'Kerala Startup Mission, KINFRA',
    imageUrl: '/kerala_startupjpg.jpg',
    eventVector: { Music: 0.0, Food: 0.1, Art: 0.0, Tech: 1.0, Outdoor: 0.0, Nightlife: 0.0, Luxury: 0.0 }
  },
  {
    id: '10',
    eventName: 'Classical Dance Recital',
    description: 'A mesmerizing evening of Mohiniyattam and Bharatanatyam performances.',
    location: 'Margi Theatre, Fort',
    imageUrl: '/margi_theatre.jpg',
    eventVector: { Music: 0.8, Food: 0.0, Art: 1.0, Tech: 0.0, Outdoor: 0.0, Nightlife: 0.4, Luxury: 0.4 }
  }
];

app.get('/api/live-events', async (req, res) => {
  try {
    // Return hardcoded events directly to show the matched images
    res.json(HARDCODED_EVENTS);
  } catch (error) {
    console.error('Error processing events:', error);
    res.json(HARDCODED_EVENTS);
  }
});

app.post('/api/generate-explanation', async (req, res) => {
  const { topEvents, userWeights } = req.body;
  
  if (!topEvents || !userWeights) {
    return res.status(400).json({ error: 'Missing topEvents or userWeights' });
  }

  try {
    const prompt = `
    You are an AI event curator for Trivandrum. 
    The user has the following preference weights for [Music, Food, Art, Tech, Outdoor, Nightlife, Luxury]:
    ${JSON.stringify(userWeights)}
    
    Based on their preferences, the top 3 recommended events are:
    ${JSON.stringify(topEvents.map((e: any) => e.eventName))}
    
    Write a short, 2-sentence explanation of why these specific events are the perfect match for their current taste profile.
    `;

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    res.json({ explanation: response.text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.json({ explanation: "These events align perfectly with your current taste profile, offering a great mix of your preferred categories." });
  }
});

app.post('/api/chat-recommendation', async (req, res) => {
  const { query, events, userWeights } = req.body;
  
  if (!query || !events || !userWeights) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!events || events.length === 0) {
    return res.json({ reply: "There are no live events available to recommend right now." });
  }

  const DIMENSIONS = ['Music', 'Food', 'Art', 'Tech', 'Outdoor', 'Nightlife', 'Luxury'];
  const getScore = (eventVector: any, weights: number[]) => {
    if (!eventVector) return 0;
    const rawScore = DIMENSIONS.reduce((sum, dim, i) => sum + (eventVector[dim] || 0) * weights[i], 0);
    const maxPossible = DIMENSIONS.reduce((sum, dim) => sum + (eventVector[dim] || 0), 0);
    return maxPossible > 0 ? rawScore / maxPossible : 0;
  };
  
  const sortedEvents = [...events].sort((a, b) => {
    const scoreA = getScore(a.eventVector || a.categories, userWeights);
    const scoreB = getScore(b.eventVector || b.categories, userWeights);
    return scoreB - scoreA;
  });
  
  const topEvent = sortedEvents[0];
  const matchScore = getScore(topEvent.eventVector || topEvent.categories, userWeights);
  const percentage = Math.round(matchScore * 100);
  
  const reply = `Based on your unique taste profile, your top match is **${topEvent.name || topEvent.eventName}** at ${topEvent.location}!\n\n${topEvent.description}\n\n*This recommendation is a ${percentage}% match based on your current preference weights.*`;
  
  res.json({ reply });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
