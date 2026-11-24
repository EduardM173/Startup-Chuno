#!/bin/sh
set -eu
psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER:-postgres}" --dbname postgres --set=pw="${CLIENTES_DB_PASSWORD}" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE', 'clientes_user', :'pw') WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='clientes_user')
\gexec
SELECT 'CREATE DATABASE clientes_db OWNER clientes_user' WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname='clientes_db')
\gexec
REVOKE ALL ON DATABASE clientes_db FROM PUBLIC;
GRANT CONNECT ON DATABASE clientes_db TO clientes_user;
SQL
psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER:-postgres}" --dbname postgres --set=pw="${CUENTAS_DB_PASSWORD}" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE', 'cuentas_user', :'pw') WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='cuentas_user')
\gexec
SELECT 'CREATE DATABASE cuentas_db OWNER cuentas_user' WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname='cuentas_db')
\gexec
REVOKE ALL ON DATABASE cuentas_db FROM PUBLIC;
GRANT CONNECT ON DATABASE cuentas_db TO cuentas_user;
SQL
psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER:-postgres}" --dbname postgres --set=pw="${PAGOS_DB_PASSWORD}" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE', 'pagos_user', :'pw') WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='pagos_user')
\gexec
SELECT 'CREATE DATABASE pagos_db OWNER pagos_user' WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname='pagos_db')
\gexec
REVOKE ALL ON DATABASE pagos_db FROM PUBLIC;
GRANT CONNECT ON DATABASE pagos_db TO pagos_user;
SQL
psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER:-postgres}" --dbname postgres --set=pw="${TRANSFERENCIAS_DB_PASSWORD}" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE', 'transferencias_user', :'pw') WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='transferencias_user')
\gexec
SELECT 'CREATE DATABASE transferencias_db OWNER transferencias_user' WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname='transferencias_db')
\gexec
REVOKE ALL ON DATABASE transferencias_db FROM PUBLIC;
GRANT CONNECT ON DATABASE transferencias_db TO transferencias_user;
SQL
psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER:-postgres}" --dbname postgres --set=pw="${PRESTAMOS_DB_PASSWORD}" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE', 'prestamos_user', :'pw') WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='prestamos_user')
\gexec
SELECT 'CREATE DATABASE prestamos_db OWNER prestamos_user' WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname='prestamos_db')
\gexec
REVOKE ALL ON DATABASE prestamos_db FROM PUBLIC;
GRANT CONNECT ON DATABASE prestamos_db TO prestamos_user;
SQL
psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER:-postgres}" --dbname postgres --set=pw="${SANDBOX_DB_PASSWORD}" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE', 'sandbox_user', :'pw') WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='sandbox_user')
\gexec
SELECT 'CREATE DATABASE sandbox_db OWNER sandbox_user' WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname='sandbox_db')
\gexec
REVOKE ALL ON DATABASE sandbox_db FROM PUBLIC;
GRANT CONNECT ON DATABASE sandbox_db TO sandbox_user;
SQL
