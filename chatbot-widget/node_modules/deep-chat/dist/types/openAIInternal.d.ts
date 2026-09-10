import { OpenAIMessage } from './openAIResult';
import { OpenAIChat } from './openAI';
export type OpenAIConverseBodyInternal = OpenAIChat & {
    model: string;
    messages?: OpenAIMessage[];
};
export type OpenAIFileContent = {
    type: string;
    image_url?: string;
    input_audio?: {
        data?: string;
        format: string;
    };
    text?: string;
}[];
//# sourceMappingURL=openAIInternal.d.ts.map