import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, ContactShadows } from '@react-three/drei';
import NurseAvatar from './components/NurseAvatar';
import ChatInterface from './components/ChatInterface';
import VitalsMonitor from './components/VitalsMonitor';
import { Message, AgentStatus, VitalsData } from './types';
import { initializeChat, sendMessageToGemini, generateMockVitals } from './services/geminiService';

// Type definition for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [vitals, setVitals] = useState<VitalsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  // Refs for speech
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);

  // Initialize AI on mount
  useEffect(() => {
    const initChat = async () => {
      try {
        const apiKey = import.meta.env.VITE_API_KEY;
        if (apiKey) {
          await initializeChat(apiKey);
          setMessages([{
            id: 'welcome',
            role: 'model',
            text: "Hello. I am NURA, your medical support agent. I can monitor your vitals, answer medical questions, or schedule appointments. How can I assist you today?",
            timestamp: new Date()
          }]);
        } else {
          const errorMsg = "System Alert: VITE_API_KEY is missing. Please check your .env.local file.";
          setError(errorMsg);
          setMessages([{
            id: 'error',
            role: 'system',
            text: errorMsg,
            timestamp: new Date()
          }]);
        }
      } catch (error: any) {
        console.error("Initialization error", error);
        setError(`Failed to initialize neural core: ${error.message}`);
      }
    };

    initChat();

    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            console.log('Voice Input:', transcript);
            setIsListening(false);
            handleSendMessage(transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
            setStatus('idle');
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
            if (status === 'listening') setStatus('idle');
        };
    }
  }, []);

  // Text-to-Speech Function
  const speakResponse = (text: string) => {
    if (!synthRef.current) return;
    
    // Stop any ongoing speech
    synthRef.current.cancel();

    // Clean text (remove markdown like **bold**) for better speech
    const cleanText = text.replace(/\*/g, '').replace(/#/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.1; // Slightly faster
    utterance.pitch = 1.05; // Slightly higher/robotic

    // Try to find a female/Google voice
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => setStatus('speaking');
    utterance.onend = () => setStatus('idle');
    utterance.onerror = () => setStatus('idle');

    synthRef.current.speak(utterance);
  };

  const handleToggleVoice = () => {
    if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
        setStatus('idle');
    } else {
        try {
            recognitionRef.current?.start();
            setIsListening(true);
            setStatus('listening');
        } catch (e) {
            console.error("Microphone start failed", e);
        }
    }
  };

  // Tool Handler
  const handleToolCall = async (toolName: string, args: any): Promise<any> => {
    // Log tool usage to chat for "Agentic" feel
    const toolMsgId = Date.now().toString();
    setMessages(prev => [...prev, {
      id: toolMsgId,
      role: 'model',
      text: `Accessing Module: ${toolName}...`,
      timestamp: new Date(),
      isToolUse: true
    }]);

    await new Promise(r => setTimeout(r, 800)); // Fake processing delay for visual effect

    if (toolName === 'checkVitals') {
      const newVitals = generateMockVitals();
      setVitals(newVitals);
      return { 
        vitals: newVitals, 
        summary: `Vitals scanned. HR: ${newVitals.heartRate}, BP: ${newVitals.bloodPressure}, SpO2: ${newVitals.oxygenLevel}%` 
      };
    }
    
    if (toolName === 'searchMedicalDatabase') {
      return { 
        results: `Found 3 articles matching "${args.query}". Common treatments include rest, hydration, and over-the-counter anti-inflammatories. Advise monitoring for fever.` 
      };
    }

    if (toolName === 'scheduleAppointment') {
      return {
        confirmation: `Appointment slot reserved for ${args.department} (Urgency: ${args.urgency || 'Normal'}). Ticket #9923.`
      }
    }

    return { error: "Unknown tool" };
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setStatus('thinking');

    try {
      const responseText = await sendMessageToGemini(text, handleToolCall);
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      }]);
      
      // Speak the response
      speakResponse(responseText);

    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message || "Connection Error";
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'system',
        text: `CRITICAL ERROR: ${errorMessage}`,
        timestamp: new Date()
      }]);
      setStatus('idle');
    }
  };

  return (
    <div className="h-screen w-full bg-[#050505] text-white relative flex flex-col md:flex-row overflow-hidden">
      {/* 3D Scene Layer (Background/Left) */}
      <div className="absolute inset-0 z-0 md:relative md:w-1/2 lg:w-3/5 h-[40vh] md:h-full border-b md:border-b-0 md:border-r border-slate-800">
        <Canvas camera={{ position: [0, 0.5, 4.5], fov: 40 }} shadows>
          <color attach="background" args={['#050505']} />
          <Suspense fallback={null}>
            {/* Lighting for the Nurse Model */}
            <ambientLight intensity={0.5} />
            <spotLight position={[5, 5, 5]} angle={0.5} penumbra={1} intensity={10} castShadow />
            <pointLight position={[-5, -5, -5]} intensity={1} color="#0ea5e9" />
            
            {/* Environment Reflections */}
            <Environment preset="city" />
            
            <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
            
            <NurseAvatar status={status} />
            
            <ContactShadows opacity={0.5} scale={10} blur={2} far={4} resolution={256} color="#000000" />
            
            <OrbitControls 
              enableZoom={false} 
              enablePan={false} 
              maxPolarAngle={Math.PI / 1.8} 
              minPolarAngle={Math.PI / 2.2}
              minAzimuthAngle={-Math.PI / 4}
              maxAzimuthAngle={Math.PI / 4}
            />
          </Suspense>
          <gridHelper args={[20, 20, 0x111111, 0x050505]} position={[0, -2, 0]} />
        </Canvas>
        
        {/* Overlay Status Label */}
        <div className="absolute top-6 left-6 pointer-events-none select-none">
          <h1 className="text-3xl font-bold font-mono tracking-tighter text-white drop-shadow-lg">NURA<span className="text-cyan-500">.AI</span></h1>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${status === 'idle' ? 'bg-cyan-500' : status === 'thinking' ? 'bg-amber-400 animate-bounce' : status === 'speaking' ? 'bg-green-500 animate-pulse' : 'bg-purple-500 animate-pulse'}`}></div>
            <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">{status} MODE</span>
          </div>
        </div>
      </div>

      {/* UI Layer (Right) */}
      <div className="relative z-10 w-full md:w-1/2 lg:w-2/5 h-[60vh] md:h-full flex flex-col p-4 md:p-6 gap-4 bg-gradient-to-t from-black via-slate-900/50 to-slate-900/0">
        {/* Vitals Panel (Top of Sidebar) */}
        <div className="flex-shrink-0">
          <VitalsMonitor data={vitals} />
        </div>

        {/* Chat Panel (Remaining space) */}
        <div className="flex-1 min-h-0">
          <ChatInterface 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            onToggleVoice={handleToggleVoice}
            isProcessing={status === 'thinking'} 
            isListening={isListening}
          />
        </div>
        
        {error && (
          <div className="absolute bottom-4 left-4 right-4 bg-red-900/90 border border-red-500 text-white p-3 rounded-lg text-xs font-mono">
            ⚠ {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;