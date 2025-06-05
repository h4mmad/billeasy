// See: https://stackoverflow.com/questions/44383387/typescript-error-property-user-does-not-exist-on-type-request

import { Request } from "express";
export interface IGetUserAuthInfoRequest extends Request {
  user?: {
    email: string;
    id: string;
  }; // or any other type
}
