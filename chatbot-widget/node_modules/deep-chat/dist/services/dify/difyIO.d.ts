import { MessageContentI } from '../../types/messagesInternal';
import { DifyBlockingResponse } from '../../types/difyResult';
import { Messages } from '../../views/chat/messages/messages';
import { Response as ResponseI } from '../../types/response';
import { DirectServiceIO } from '../utils/directServiceIO';
import { DeepChat } from '../../deepChat';
export declare class DifyIO extends DirectServiceIO {
    insertKeyPlaceholderText: string;
    keyHelpUrl: string;
    url: string;
    permittedErrorPrefixes: string[];
    private _conversationId;
    private readonly _user;
    private readonly _inputs;
    private readonly _uploadUrl;
    private readonly _mode;
    constructor(deepChat: DeepChat);
    private preprocessBody;
    callServiceAPI(messages: Messages, pMessages: MessageContentI[], files?: File[]): Promise<void>;
    extractResultData(result: DifyBlockingResponse | Blob): Promise<ResponseI>;
}
//# sourceMappingURL=difyIO.d.ts.map