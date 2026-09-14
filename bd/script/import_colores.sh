#!/bin/bash
# Script para importar los colores a la base de datos usando psql
# Uso con docker: docker exec -i <nombre_contenedor_postgres> psql -U <usuario> -d <base_de_datos> < bd/script/import_colores.sql
# O ejecutar este sh dentro del contenedor: docker exec -i <nombre_contenedor> bash < bd/script/import_colores.sh

psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-pintuclic} -f /dev/stdin << 'EOF'
\i bd/script/import_colores.sql
EOF
