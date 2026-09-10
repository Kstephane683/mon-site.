import { KeyVerificationDetails } from '../../types/keyVerificationDetails';
import { MessageContentI } from '../../types/messagesInternal';
import { DirectServiceIO } from '../utils/directServiceIO';
import { BuildHeadersFunc } from '../../types/headers';
import { MessageFile } from '../../types/messageFile';
import { OpenAIChat } from '../../types/openAI';
import { APIKey } from '../../types/APIKey';
import { DeepChat } from '../../deepChat';
export declare abstract class OpenAIBaseIO extends DirectServiceIO {
    insertKeyPlaceholderText: string;
    keyHelpUrl: string;
    permittedErrorPrefixes: string[];
    constructor(deepChat: DeepChat, keyVerificationDetailsArg?: KeyVerificationDetails, buildHeadersFuncArg?: BuildHeadersFunc, apiKeyArg?: APIKey, configArg?: true | OpenAIChat);
    protected processConfig(config: OpenAIChat, deepChat: DeepChat): void;
    protected static getBaseFileContent(files: MessageFile[]): (MessageFile | {
        type: string;
        input_audio: {
            data: string | undefined;
            format: string;
        };
    })[];
    protected static getBaseContent(message: MessageContentI, includeFilesForRole?: boolean): string | object[] | undefined;
}
//# sourceMappingURL=openAIBaseIO.d.ts.map