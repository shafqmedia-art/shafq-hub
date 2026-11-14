(pgrep -f "postgres -D /tmp/pgdata" >/dev/null || su postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D /tmp/pgdata -o '-p 5544 -k /tmp' -l /tmp/pg.log start" >/dev/null 2>&1); sleep 2
pkill -f mock_supabase.py; sleep 1
P="psql -h /tmp -p 5544 -U postgres"; $P -q -c "drop database if exists shafq with (force)" && $P -q -c "create database shafq" && for f in /tmp/stub.sql shafq-app/schema.sql shafq-app/schema2.sql shafq-app/schema3.sql shafq-app/schema4.sql shafq-app/schema5.sql shafq-app/schema6.sql; do $P -d shafq -q -v ON_ERROR_STOP=1 -f $f >/dev/null 2>&1 || echo FAIL $f; done
(python3 mock_supabase.py >/tmp/mock.log 2>&1 &); sleep 1.5
