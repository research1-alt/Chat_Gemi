// FIX: Add User interface to resolve import error in UserManagementPanel.tsx
export interface User {
    email: string;
    password: string;
    role: 'admin' | 'user';
}

export interface Drawing {
    name: string;
    dataUrl: string;
}

export interface SolutionStep {
    description: string;
    isSafetyWarning: boolean;
}

export interface BotResponse {
    solutionTitle: string | null;
    steps: SolutionStep[];
    clarifyingQuestion: string | null;
    suggestedQueries: string[];
    noSolutionFound: boolean;
    drawingFileName: string | null;
    error?: string;
}

export interface Message {
    id: number;
    sender: 'user' | 'bot';
    text: string;
    botResponse?: BotResponse;
}