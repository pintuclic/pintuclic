import { CuentasRepository } from '../repositories/cuentas.repository';
import { VerificacionRepository } from '../repositories/verificacion.repository';
import { DireccionRepository } from '../repositories/direccion.repository';
import { EmpresaRepository } from '../repositories/empresa.repository';
import { CuentasService } from '../services/cuentas.service';
import { AuthService } from '../services/auth.service';
import { PerfilService } from '../services/perfil.service';
import { DireccionService } from '../services/direccion.service';
import { EmpresaAdminService } from '../services/empresa-admin.service';
import { Usuario, NewUsuario, UsuarioUpdate, EnumEstadoUsuario } from '../../../core/db/types';
import { CredencialesService } from '../../m20-seguridad/services/credenciales.service';
import { SesionService } from '../../m20-seguridad/services/sesion.service';

// ==============================================================================
// M04 - SUITE DE VALIDACIÓN DE CRITERIOS DE ACEPTACIÓN (HU-CUE-01 a HU-CUE-09)
// ==============================================================================

async function ejecutarPruebasM04(): Promise<void> {
  console.log('🚀 Iniciando suite de validación técnica de M04: Cuentas, Autenticación y Perfil...\n');

  let superadas = 0;
  let fallidas = 0;

  function assert(condicion: boolean, descripcion: string): void {
    if (condicion) {
      console.log(`  ✅ [PASS] ${descripcion}`);
      superadas++;
    } else {
      console.error(`  ❌ [FAIL] ${descripcion}`);
      fallidas++;
    }
  }

  // Repositorio en memoria mockeando Kysely para pruebas unitarias limpias
  const tablaUsuarios: Map<number, Usuario> = new Map();
  let secuenciaUsuario = 100;

  const mockCuentasRepo = {
    buscarPorCorreo: async (correo: string) => {
      const norm = correo.trim().toLowerCase();
      for (const u of tablaUsuarios.values()) {
        if (u.correo.toLowerCase() === norm) return { ...u };
      }
      return undefined;
    },
    buscarPorId: async (id: number) => {
      const u = tablaUsuarios.get(id);
      return u ? { ...u } : undefined;
    },
    crearUsuario: async (datos: NewUsuario) => {
      secuenciaUsuario++;
      const nuevo: Usuario = {
        id_usuario: secuenciaUsuario,
        nombre: datos.nombre,
        telefono: datos.telefono ?? null,
        correo: datos.correo.toLowerCase(),
        contrasena: datos.contrasena,
        id_rol: datos.id_rol ?? null,
        estado: datos.estado ?? 'activo',
        tipo: datos.tipo ?? 'normal',
      };
      tablaUsuarios.set(secuenciaUsuario, nuevo);
      return { ...nuevo };
    },
    asignarRolUsuario: async (idUsuario: number, idRol: number) => {
      const u = tablaUsuarios.get(idUsuario);
      if (u) {
        u.id_rol = idRol;
      }
    },
    obtenerUsuarioConRol: async (idUsuario: number) => {
      const u = tablaUsuarios.get(idUsuario);
      if (!u) return null;
      return {
        usuario: { ...u },
        rolNombre: u.id_rol === 1 ? 'administrador' : u.id_rol === 3 ? 'empresa_vip' : 'cliente',
      };
    },
    actualizarEstado: async (idUsuario: number, estado: EnumEstadoUsuario) => {
      const u = tablaUsuarios.get(idUsuario);
      if (u) u.estado = estado;
    },
    actualizarUsuario: async (idUsuario: number, cambios: UsuarioUpdate) => {
      const u = tablaUsuarios.get(idUsuario);
      if (u) Object.assign(u, cambios);
    },
    actualizarContrasena: async (idUsuario: number, nuevoHash: string) => {
      const u = tablaUsuarios.get(idUsuario);
      if (u) u.contrasena = nuevoHash;
    },
    actualizarCorreo: async (idUsuario: number, nuevoCorreo: string) => {
      const u = tablaUsuarios.get(idUsuario);
      if (u) u.correo = nuevoCorreo.toLowerCase();
    },
  } as unknown as CuentasRepository;

  const verificacionRepo = new VerificacionRepository();
  const direccionRepo = new DireccionRepository();
  const empresaRepo = new EmpresaRepository();

  const mockCredenciales = {
    derivarContrasena: async (plana: string) => {
      // Simulación de hash BCrypt
      return '$2b$12$' + Buffer.from(plana).toString('base64').padEnd(53, 'x');
    },
    verificarContrasena: async (plana: string, hash: string) => {
      const esperado = '$2b$12$' + Buffer.from(plana).toString('base64').padEnd(53, 'x');
      return esperado === hash;
    },
    verificarCredenciales: async (correo: string, plana: string) => {
      const u = await mockCuentasRepo.buscarPorCorreo(correo);
      if (!u) return null;
      const coincide = ('$2b$12$' + Buffer.from(plana).toString('base64').padEnd(53, 'x')) === u.contrasena;
      return coincide ? { id_usuario: u.id_usuario, correo: u.correo } : null;
    },
  } as unknown as CredencialesService;

  const mockSesion = {
    clasificarSesion: (idRol: number | null) => (idRol === 1 ? 'admin' : 'cliente'),
    abrirSesion: async (_payload: unknown, _tipo: unknown) => ({
      idSesion: 'a0000000-0000-0000-0000-000000000001',
      accessToken: 'sample.jwt.token.simulado',
      refreshToken: 'sample.refresh.token.simulado',
      expiraEnSegundos: 3600,
      expiraEn: new Date(Date.now() + 3600000).toISOString(),
    }),
    cerrarSesion: async (_id: string) => true,
    invalidarSesionesDeUsuario: async (_id: number, _motivo: string) => 1,
  } as unknown as SesionService;

  const cuentasService = new CuentasService(mockCuentasRepo, verificacionRepo, empresaRepo, mockCredenciales);
  const authService = new AuthService(mockCuentasRepo, verificacionRepo, mockCredenciales, mockSesion);
  const perfilService = new PerfilService(mockCuentasRepo, verificacionRepo, empresaRepo, mockCredenciales);
  const direccionService = new DireccionService(direccionRepo);
  const empresaAdminService = new EmpresaAdminService(mockCuentasRepo, empresaRepo);

  try {
    // -------------------------------------------------------------------------
    // 1. HU-CUE-01 y HU-CUE-08: Registro de particular y unicidad
    // -------------------------------------------------------------------------
    console.log('--- 1. HU-CUE-01 / HU-CUE-08: Registro Particular y Unicidad ---');

    const reg = await cuentasService.registrarParticular({
      nombre: 'Carlos Mendoza',
      correo: 'carlos.mendoza@gmail.com',
      telefono: '3001112233',
      contrasena: 'ClaveSegura2026!',
    });

    assert(reg.requiere_verificacion === true, 'CA-CUE-01-01: Cuenta creada en estado pendiente');
    assert(reg.estado === 'pendiente', 'CA-CUE-01-01: Estado inicial es pendiente de activación');

    // Unicidad (HU-CUE-08 / CA-CUE-01-04)
    let duplicadoRechazado = false;
    try {
      await cuentasService.registrarParticular({
        nombre: 'Carlos Clon',
        correo: 'carlos.mendoza@gmail.com',
        telefono: '3009998877',
        contrasena: 'OtraClave2026!',
      });
    } catch (_err) {
      duplicadoRechazado = true;
    }
    assert(duplicadoRechazado, 'CA-CUE-01-04 / CA-CUE-08-01: Rechazo de registro duplicado con mismo correo');

    // Obtener OTP generado
    const otpActivo = await verificacionRepo.obtenerCodigo('carlos.mendoza@gmail.com', 'registro');
    assert(otpActivo !== null && otpActivo.codigo.length === 6, 'RF-CUE-01-02: Código OTP de 6 dígitos emitido');

    // Intento con código incorrecto
    let falloCodigo = false;
    try {
      await cuentasService.verificarCodigoActivacion({
        correo: 'carlos.mendoza@gmail.com',
        codigo: '000000',
      });
    } catch (_e) {
      falloCodigo = true;
    }
    assert(falloCodigo, 'CA-CUE-01-03: Rechazo de código incorrecto');

    // Verificación exitosa
    if (otpActivo) {
      const verif = await cuentasService.verificarCodigoActivacion({
        correo: 'carlos.mendoza@gmail.com',
        codigo: otpActivo.codigo,
      });
      assert(verif.verificado === true, 'CA-CUE-01-02: Cuenta activada con código correcto');
      assert(verif.usuario.estado === 'activo', 'CA-CUE-01-02: Estado pasa a activo');
    }

    // -------------------------------------------------------------------------
    // 2. HU-CUE-04: Autenticación (Login y Logout)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. HU-CUE-04: Inicio y Cierre de Sesión ---');

    let loginErroneo = false;
    try {
      await authService.login({
        correo: 'carlos.mendoza@gmail.com',
        contrasena: 'PasswordEquivocada123',
      });
    } catch (_e) {
      loginErroneo = true;
    }
    assert(loginErroneo, 'CA-CUE-04-02: Rechazo con contraseña errónea');

    const loginExitoso = await authService.login({
      correo: 'carlos.mendoza@gmail.com',
      contrasena: 'ClaveSegura2026!',
    });
    assert(Boolean(loginExitoso.sesion.accessToken), 'CA-CUE-04-01: JWT y sesión emitidos correctamente');
    assert(Boolean(loginExitoso.sesion.idSesion), 'CA-CUE-04-01: Sesión UUID creada en backend');

    const logout = await authService.logout(loginExitoso.sesion.idSesion);
    assert(logout.mensaje.includes('exitosa'), 'CA-CUE-04-04: Cierre explícito de sesión completado');

    // -------------------------------------------------------------------------
    // 3. HU-CUE-02: Google Identity y Vinculación
    // -------------------------------------------------------------------------
    console.log('\n--- 3. HU-CUE-02: Registro y Acceso con Google Identity ---');

    // Sugerencia de vinculación cuando ya existe la cuenta
    const gSug = await authService.autenticarConGoogle({
      idToken: 'token-google-carlos',
      correo: 'carlos.mendoza@gmail.com',
      nombre: 'Carlos Mendoza G',
      googleId: 'google-uid-1001',
    });
    assert(
      gSug.tipo === 'sugerencia_vinculacion',
      'CA-CUE-02-02: Sugiere vincular cuando el correo coincide con cuenta existente'
    );

    // Confirmar vinculación
    const vincular = await authService.confirmarVinculacionGoogle({
      correo: 'carlos.mendoza@gmail.com',
      confirmar: true,
      googleId: 'google-uid-1001',
    });
    assert(vincular.usuario.correo === 'carlos.mendoza@gmail.com', 'CA-CUE-02-05: Cuenta vinculada a Google exitosamente');

    // Acceso directo tras vincular
    const gDirecto = await authService.autenticarConGoogle({
      idToken: 'token-google-carlos',
      correo: 'carlos.mendoza@gmail.com',
      googleId: 'google-uid-1001',
    });
    assert(gDirecto.tipo === 'login_exitoso', 'CA-CUE-02-05: Acceso concedido indistintamente por Google');

    // -------------------------------------------------------------------------
    // 4. HU-CUE-05: Recuperación de Contraseña
    // -------------------------------------------------------------------------
    console.log('\n--- 4. HU-CUE-05: Recuperación de Contraseña ---');

    // Solicitar con correo existente
    const rec1 = await authService.solicitarRecuperacion({ correo: 'carlos.mendoza@gmail.com' });
    assert(rec1.mensaje.includes('Si el correo'), 'CA-CUE-05-01: Solicitud procesada correctamente');

    // Solicitar con correo inexistente (respuesta uniforme)
    const rec2 = await authService.solicitarRecuperacion({ correo: 'inexistente@correo.com' });
    assert(rec2.mensaje === rec1.mensaje, 'CA-CUE-05-02: Respuesta uniforme para evitar enumeración');

    // Confirmar recuperación con OTP
    const otpRec = await verificacionRepo.obtenerCodigo('carlos.mendoza@gmail.com', 'recuperacion_password');
    if (otpRec) {
      const confRec = await authService.confirmarRecuperacion({
        correo: 'carlos.mendoza@gmail.com',
        codigo: otpRec.codigo,
        contrasenaNueva: 'NuevaClaveSegura2026!',
      });
      assert(confRec.mensaje.includes('correctamente'), 'CA-CUE-05-04: Contraseña renovada con éxito');
    }

    // -------------------------------------------------------------------------
    // 5. HU-CUE-06: Perfil de Usuario
    // -------------------------------------------------------------------------
    console.log('\n--- 5. HU-CUE-06: Gestión de Perfil ---');

    const usuarioCarlos = await mockCuentasRepo.buscarPorCorreo('carlos.mendoza@gmail.com');
    if (usuarioCarlos) {
      const perfil = await perfilService.obtenerPerfil(usuarioCarlos.id_usuario);
      assert(perfil.nombre === 'Carlos Mendoza', 'CA-CUE-06-01: Consulta de perfil propio');
      assert(!('contrasena' in perfil), 'HU-SEG-06: Contraseña ausente en perfil');

      const perfAct = await perfilService.actualizarPerfil(usuarioCarlos.id_usuario, {
        telefono: '3157778899',
      });
      assert(perfAct.telefono === '3157778899', 'RF-CUE-06-02: Actualización de datos personales');
    }

    // -------------------------------------------------------------------------
    // 6. HU-CUE-07: Gestión de Direcciones
    // -------------------------------------------------------------------------
    console.log('\n--- 6. HU-CUE-07: Gestión de Direcciones del Cliente ---');

    if (usuarioCarlos) {
      const dir1 = await direccionService.crearDireccion(usuarioCarlos.id_usuario, {
        direccion: 'Carrera 7 # 72-41',
        barrio: 'Rosales',
        apartamento_casa: 'Torre 2 Apto 501',
        nombre_apellido: 'Carlos Mendoza',
        telefono: '3157778899',
        es_predeterminada: false,
        latitud: 4.655,
        longitud: -74.056,
      });
      assert(dir1.es_predeterminada === true, 'CA-CUE-07-01: Primera dirección marcada como predeterminada');

      const dir2 = await direccionService.crearDireccion(usuarioCarlos.id_usuario, {
        direccion: 'Calle 100 # 15-20',
        barrio: 'Chicó',
        nombre_apellido: 'Carlos Mendoza Oficina',
        telefono: '3157778899',
        es_predeterminada: true,
      });
      assert(dir2.es_predeterminada === true, 'CA-CUE-07-02: Nueva dirección predeterminada establecida');

      const dirs = await direccionService.listarDirecciones(usuarioCarlos.id_usuario);
      assert(dirs.length === 2, 'RF-CUE-07-01: Listado de direcciones del cliente');
      const dir1Actualizada = dirs.find((d) => d.id_direccion === dir1.id_direccion);
      assert(dir1Actualizada?.es_predeterminada === false, 'CA-CUE-07-02: Desmarcada la anterior predeterminada');
    }

    // -------------------------------------------------------------------------
    // 7. HU-CUE-03 y HU-CUE-09: Registro y Aprobación de Empresa
    // -------------------------------------------------------------------------
    console.log('\n--- 7. HU-CUE-03 / HU-CUE-09: Registro y Aprobación de Empresa ---');

    const regEmpresa = await cuentasService.registrarEmpresa({
      nombre_empresa: 'Pinturas del Norte S.A.S.',
      nombre_representante: 'Andrés Morales',
      correo_empresarial: 'contacto@pinturasnorte.co',
      telefono: '3205554433',
      nit: '900123456-7',
      contrasena: 'EmpresaClave2026!',
    });
    assert(regEmpresa.estado === 'pendiente', 'CA-CUE-03-01: Cuenta empresa queda en estado pendiente');

    // Consulta de estado por parte de la empresa
    const consultaEmpresa = await cuentasService.consultarEstadoSolicitudEmpresa('900123456-7');
    assert(consultaEmpresa.estado === 'pendiente', 'RF-CUE-03-04: Empresa puede consultar estado en revisión');

    // Listado administrativo (HU-CUE-09)
    const solicitudes = await empresaAdminService.listarSolicitudesPendientes();
    assert(solicitudes.length >= 1, 'CA-CUE-09-01: Administrador visualiza solicitudes pendientes');

    // Dictamen de aprobación por el admin
    const solicitudPendiente = solicitudes.find((s) => s.nit === '900123456-7');
    if (solicitudPendiente) {
      const dictamen = await empresaAdminService.dictaminarSolicitudEmpresa(
        solicitudPendiente.id_solicitud,
        { decision: 'aprobar' },
        1 // idAdmin
      );
      assert(dictamen.solicitud.estado === 'aprobada', 'CA-CUE-09-02: Solicitud dictaminada como aprobada');

      const usuarioEmpresa = await mockCuentasRepo.buscarPorCorreo('contacto@pinturasnorte.co');
      assert(usuarioEmpresa?.estado === 'activo', 'CA-CUE-09-02: Cuenta empresa activada');
      assert(usuarioEmpresa?.id_rol === 3, 'RF-CUE-09-04: Rol corporativo VIP asignado con condiciones de empresa');
    }

    console.log(`\n======================================================`);
    console.log(`🎯 RESULTADOS: Superadas: ${superadas} | Fallidas: ${fallidas}`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error('💥 Excepción no controlada durante las pruebas:', err);
    process.exit(1);
  }
}

void ejecutarPruebasM04();
