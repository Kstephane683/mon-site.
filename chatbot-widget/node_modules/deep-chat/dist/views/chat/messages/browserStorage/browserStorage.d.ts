import { BrowserStorageItem, BrowserStorageConfig } from '../../../../types/browserStorage';
import { MessageContentI } from '../../../../types/messagesInternal';
export declare class BrowserStorage {
    private readonly storageKey;
    private readonly maxMessages;
    readonly trackInputText: boolean;
    readonly trackScrollHeight: boolean;
    constructor(config: BrowserStorageConfig | true);
    get(): BrowserStorageItem;
    private set;
    addMessages(messages: MessageContentI[]): void;
    addInputText(inputText: string): void;
    addScrollHeight(scrollHeight: number): void;
    clear(): void;
}
//# sourceMappingURL=browserStorage.d.ts.map