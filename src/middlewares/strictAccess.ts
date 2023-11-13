import { Request, NextFunction } from 'express';
import getRequestIp from '../utils/getRequestIp';

export const whiteList = (ips: string[]) => {
    return (req: Request, res: any, next: NextFunction) => {
        if (ips.includes(getRequestIp(req))) {
            next(); // IP whitelisted, continue.
        }
        else {
            res.status(403).send('Access Forbidden'); // IP is not whitelisted, send a 403 Forbidden response
        }
    };
};

export const blackList = (ips: string[]) => {
    return (req: Request, res: any, next: NextFunction) => {
        if (ips.includes(getRequestIp(req))) {
            res.status(403).send('Access Forbidden'); // IP is blacklisted, send a 403 Forbidden response
        } 
        else {
            next(); // Ip is not blacklisted, continue.
        }
    };
};

export default (ips: string[], restrict: boolean = false) => {
    return restrict ? blackList(ips) : whiteList(ips) // return blacklist middleware if restrict is True, else whitelist
};
