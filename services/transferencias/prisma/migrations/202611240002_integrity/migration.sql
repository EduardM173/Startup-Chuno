ALTER TABLE "Transaction" ADD CONSTRAINT positive_amount CHECK (amount > 0);
ALTER TABLE "Transaction" ADD CONSTRAINT valid_transaction_status CHECK (status IN ('PENDIENTE','PROCESANDO','CONFIRMADO','RECHAZADO','REVERTIDO'));
