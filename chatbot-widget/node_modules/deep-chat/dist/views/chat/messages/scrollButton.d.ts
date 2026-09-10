import { HiddenMessages as HiddenMessagesT, ScrollButton as ScrollButtonT } from '../../../types/scrollToBottom';
import { MessagesBase } from './messagesBase';
export declare class ScrollButton {
    readonly hiddenElements: Set<HTMLElement>;
    private readonly io?;
    private readonly element?;
    private readonly hiddenMessagesConfig?;
    private readonly scrollButtonConfig?;
    private readonly _messages;
    private isScrollButton;
    private isScrollingToBottom;
    constructor(messages: MessagesBase, hiddenMessages?: boolean | HiddenMessagesT, scrollButton?: boolean | ScrollButtonT);
    private static displayElement;
    private static hideElement;
    private initIntersectionObserver;
    private createElement;
    private assignStyles;
    private updateHiddenElement;
    updateHidden(): void;
    clearHidden(): void;
    private displayScroll;
    updateScroll(): void;
}
//# sourceMappingURL=scrollButton.d.ts.map