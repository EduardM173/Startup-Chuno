ALTER TABLE "Account" ADD CONSTRAINT nonnegative_available CHECK (balance >= 0 AND reserved >= 0 AND reserved <= balance);
ALTER TABLE "Account" ADD CONSTRAINT valid_account_state CHECK (status IN ('ACTIVA','BLOQUEADA','CERRADA'));
ALTER TABLE "Account" ADD CONSTRAINT closed_zero CHECK (status <> 'CERRADA' OR (balance = 0 AND reserved = 0));
ALTER TABLE "Operation" ADD CONSTRAINT positive_amount CHECK (amount > 0);
