export interface CohereChat {
    model?: string;
    temperature?: number;
    prompt_truncation?: 'AUTO' | 'OFF';
    connectors?: {
        id: string;
    }[];
    documents?: {
        title: string;
        snippet: string;
    }[];
}
export type Cohere = true | CohereChat;
//# sourceMappingURL=cohere.d.ts.map