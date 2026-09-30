export function reserved(name: string): boolean {
  return (
    name.startsWith("configuracion.") ||
    [
      "personal.editar",
      "personal.desactivar",
      "seguridad.gestionar_permisos",
      "seguridad.configurar_sesion",
    ].includes(name)
  );
}
export function basePermission(
  name: string,
  catalog: string[],
): string | undefined {
  const base = `${name.split(".")[0]}.ver`;
  return name !== base && catalog.includes(base) ? base : undefined;
}
export function dependentPermissions(
  name: string,
  selected: string[],
): string[] {
  return name.endsWith(".ver")
    ? selected.filter((p) => p !== name && p.startsWith(name.slice(0, -3)))
    : [];
}
export function togglePermission(
  name: string,
  enabled: boolean,
  selected: string[],
  catalog: string[],
): string[] {
  const values = new Set(selected);
  if (enabled) {
    if (reserved(name)) return [...values];
    values.add(name);
    const base = basePermission(name, catalog);
    if (base) values.add(base);
  } else {
    values.delete(name);
    for (const p of dependentPermissions(name, selected)) values.delete(p);
  }
  return [...values].sort();
}
