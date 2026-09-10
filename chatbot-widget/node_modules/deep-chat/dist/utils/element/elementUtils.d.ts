import { MessagesBase } from '../../views/chat/messages/messagesBase';
export declare class ElementUtils {
    private static readonly CODE_SNIPPET_GENERATION_JUMP;
    static addElements(parent: HTMLElement, ...elements: HTMLElement[]): void;
    static isScrollbarAtBottomOfElement(element: HTMLElement, jump?: number): boolean;
    static cloneElement(element: HTMLElement): HTMLElement;
    static scrollToBottom(message: MessagesBase, isAnimation?: boolean, targetElement?: HTMLElement): void;
    static scrollToTop(element: HTMLElement): void;
    static isVisibleInParent(element: HTMLElement, parent: HTMLElement): boolean;
    static waitForScrollEnd(overflowElement: HTMLElement, callback: () => void): void;
    static assignButtonEvents(element: HTMLElement, func: () => void): void;
}
//# sourceMappingURL=elementUtils.d.ts.map