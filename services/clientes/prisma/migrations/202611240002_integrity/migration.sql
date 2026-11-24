ALTER TABLE "User" ADD CONSTRAINT valid_role CHECK (role IN ('ADMIN','CLIENTE'));
ALTER TABLE "User" ADD CONSTRAINT user_client_identity CHECK ((role = 'ADMIN' AND "clientId" IS NULL) OR (role = 'CLIENTE' AND "clientId" IS NOT NULL));
ALTER TABLE "User" ADD CONSTRAINT valid_user_state CHECK (status IN ('ACTIVO','BLOQUEADO','INACTIVO'));
ALTER TABLE "Client" ADD CONSTRAINT valid_client_state CHECK (status IN ('ACTIVO','BAJA'));
