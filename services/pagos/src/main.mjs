import { PrismaClient } from '../generated/client/index.js';
import { coordinator } from '../../../shared/coordinator.mjs';
coordinator('pagos',new PrismaClient());
