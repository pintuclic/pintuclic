"""Regenera exclusivamente datos públicos de prueba desde el seed central."""
from pathlib import Path
import json
import re

module = Path(__file__).resolve().parents[1]
repository = module.parents[3]
sql = (repository / 'bd/sql/seed_pintuclic.sql').read_text(encoding='utf-8')
perms = [
    {'id_permiso': int(i), 'nombre': n, 'descripcion': d, 'area': n.split('.')[0]}
    for i, n, d in re.findall(r"\((\d+),\s*'([^']+)',\s*'([^']+)',\s*'activo'\)", sql)
    if '.' in n and n.split('.')[0] in ['catalogo', 'ventas', 'personal', 'seguridad', 'configuracion']
]
clients = [
    {'id_usuario': int(i), 'nombre': n, 'telefono': t, 'correo': c, 'estado': s, 'tipo': ty}
    for i, n, t, c, role, s, ty in re.findall(r"\((\d+),\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'[^']+',\s*(\d+),\s*'([^']+)',\s*'([^']+)'\)", sql)
    if int(role) != 1 and ty in ['normal', 'empresa']
]
(module / 'assets/seed-preview.json').write_text(
    json.dumps({'empleados': [], 'clientes': clients, 'permisos': perms}, ensure_ascii=False, indent=2),
    encoding='utf-8',
)
print(f'Seed sanitizado: {len(clients)} clientes y {len(perms)} permisos; sin credenciales.')
