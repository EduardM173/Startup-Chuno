ALTER TABLE "Loan" ADD CONSTRAINT valid_loan_amount CHECK (amount > 0 AND rate >= 0 AND rate <= 60 AND months BETWEEN 1 AND 360 AND installment >= 0);
ALTER TABLE "Loan" ADD CONSTRAINT valid_loan_status CHECK (status IN ('SOLICITADO','EN_REVISION','APROBADO','RECHAZADO','CANCELADO'));
