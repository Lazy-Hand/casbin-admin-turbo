import { SetMetadata } from '@nestjs/common';

export const RESPONSE_MESSAGE_KEY = 'response_message';
export const RESPONSE_CODE_KEY = 'response_code';

export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);

export const ResponseCode = (code: number) =>
  SetMetadata(RESPONSE_CODE_KEY, code);
