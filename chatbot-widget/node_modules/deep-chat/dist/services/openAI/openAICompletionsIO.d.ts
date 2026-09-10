import { OpenAICompletionsResult, ToolCalls } from '../../types/openAIResult';
import { MessageContentI } from '../../types/messagesInternal';
import { Messages } from '../../views/chat/messages/messages';
import { Response as ResponseI } from '../../types/response';
import { OpenAIChat } from '../../types/openAI';
import { OpenAIBaseIO } from './openAIBaseIO';
export declare class OpenAICompletionsIO extends OpenAIBaseIO {
    url: string;
    _streamToolCalls?: ToolCalls;
    private static getFileContent;
    private static getContent;
    private preprocessBody;
    callServiceAPI(messages: Messages, pMessages: MessageContentI[]): Promise<void>;
    extractResultData(result: OpenAICompletionsResult, prevBody?: OpenAIChat): Promise<ResponseI>;
    private extractStreamResult;
}
//# sourceMappingURL=openAICompletionsIO.d.ts.map