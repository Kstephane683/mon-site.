import { OpenWebUIConverseResult } from '../../types/openWebUIResult';
import { MessageContentI } from '../../types/messagesInternal';
import { Messages } from '../../views/chat/messages/messages';
import { Response as ResponseI } from '../../types/response';
import { DirectServiceIO } from '../utils/directServiceIO';
import { OpenWebUIChat } from '../../types/openWebUI';
import { DeepChat } from '../../deepChat';
export declare class OpenWebUIIO extends DirectServiceIO {
    insertKeyPlaceholderText: string;
    keyHelpUrl: string;
    url: string;
    permittedErrorPrefixes: string[];
    constructor(deepChat: DeepChat);
    private preprocessBody;
    callServiceAPI(messages: Messages, pMessages: MessageContentI[]): Promise<void>;
    extractResultData(result: OpenWebUIConverseResult, prevBody?: OpenWebUIChat): Promise<ResponseI>;
    private processStreamingResponse;
    private handleTools;
}
//# sourceMappingURL=openWebUIIO.d.ts.map