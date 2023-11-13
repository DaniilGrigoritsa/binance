import { Request } from "express"

export default function getRequestIp(req: Request | any): string {
    return req.headers['X-Real-IP'] as string || req.socket.remoteAddress;
}