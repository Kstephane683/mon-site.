import { LoadHistory } from '../../../../types/history';
import { ServiceIO } from '../../../../services/serviceIO';
import { Messages } from '../messages';
import { DeepChat } from '../../../../deepChat';
export declare class History {
    private readonly _messages;
    static readonly FAILED_ERROR_MESSAGE = "Failed to load history";
    private _isLoading;
    private _isPaginationComplete;
    private _index;
    constructor(deepChat: DeepChat, messages: Messages, serviceIO: ServiceIO);
    private fetchHistory;
    private scrollToPreloadFirstEl;
    private processLoadedHistory;
    private populateMessages;
    loadHistoryOnScroll(loadHistory: LoadHistory): Promise<void>;
    private populateInitialHistory;
    private loadInitialHistory;
    private setupInitialHistory;
    private restoreScrollOrScrollToBottom;
    static addErrorPrefix(io: ServiceIO): void;
    private static displayIntroMessages;
}
//# sourceMappingURL=history.d.ts.map