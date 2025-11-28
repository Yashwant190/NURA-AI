export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  isToolUse?: boolean;
}

export interface VitalsData {
  heartRate: number;
  bloodPressure: string;
  oxygenLevel: number;
  temperature: number;
  status: 'Normal' | 'Warning' | 'Critical';
}

export type AgentStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface ToolCallLog {
  toolName: string;
  args: any;
  result: any;
}
