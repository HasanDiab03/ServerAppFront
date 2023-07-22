import { Server } from "./server";

export interface CustomResponse { // the response class we created in the backend
  timestamp: Date;
  statusCode: number;
  status: string;
  reason: string;
  message: string;
  developerMessage: string;
  data: {servers?: Server[], server?: Server} // the ? is for optional, since we may not have a value for one of the keys
}
