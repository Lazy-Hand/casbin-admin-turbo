import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(
    private readonly businessCode: number,
    message: string,
    httpStatus: HttpStatus = HttpStatus.OK,
  ) {
    super(
      {
        code: businessCode,
        message: message,
      },
      httpStatus,
    );
  }

  getBusinessCode(): number {
    return this.businessCode;
  }
}
