import { DifyBlockingResponse } from '../../../types/difyResult';
import { DifyUploadConfig, DifyFileInput } from '../../../types/difyInternal';
import { KeyVerificationDetails } from '../../../types/keyVerificationDetails';
import { Response as ResponseI } from '../../../types/response';
export declare function uploadFile(file: File, config: DifyUploadConfig): Promise<string>;
export declare function uploadFiles(files: File[], config: DifyUploadConfig): Promise<DifyFileInput[]>;
export declare function parseBlockingResponse(result: DifyBlockingResponse, onConversationIdUpdate: (id: string) => void): ResponseI;
export declare function parseStreamingResponse(result: Blob, onConversationIdUpdate: (id: string) => void): Promise<ResponseI>;
export declare const DIFY_BUILD_HEADERS: (key?: string) => {
    "Content-Type": string;
    Authorization: string;
};
export declare const DIFY_BUILD_KEY_VERIFICATION_DETAILS: (baseUrl: string) => KeyVerificationDetails;
//# sourceMappingURL=difyUtils.d.ts.map