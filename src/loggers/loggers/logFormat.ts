import { format } from 'winston';

const logFormat = format.combine(format.simple());

export default logFormat;
