-- Loan_System_Yiz · rama integracion · datos de integración QA (solo desarrollo).
-- Tablas REALES definidas en users/models.py, catalogo/models.py y prestamos/models.py.
-- Requiere ejecutar previamente python manage.py migrate.
-- Reejecutable y aislado por correos qa-loan-XX@unsa.edu.pe y códigos QA-LS-*.
-- Contraseña de TODAS las cuentas de prueba: LoanDemo2026!
-- NO ejecutar en producción. Usa tu usuario PostgreSQL; este script NO crea roles ni bases.
-- Como se inserta SQL directo, las señales/servicios Django (correo, auditoría, sanciones)
-- NO se invocan. Las fechas/sanciones son fixtures para probar la interfaz y los endpoints.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL TIME ZONE 'America/Lima';
DO $$
BEGIN
 IF to_regclass('public.users') IS NULL
    OR to_regclass('public.fichas_recurso') IS NULL
    OR to_regclass('public.ejemplares_fisicos') IS NULL
    OR to_regclass('public.prestamos') IS NULL
    OR to_regclass('public.cola_reservas') IS NULL THEN
   RAISE EXCEPTION 'Faltan las migraciones de Django. Ejecuta python manage.py migrate.';
 END IF;
END $$;

-- Crear cuentas de prueba con contraseñas hash PBKDF2 compatible con Django.
-- Todas con status ACTIVO: la fecha suspendido_hasta restringe préstamos, NO el login.
INSERT INTO users (
  password,last_login,is_superuser,first_name,last_name,is_staff,is_active,
  date_joined,email,dni,cui,tipo_usuario,status,suspendido_hasta
)
SELECT
 'pbkdf2_sha256$1000000$loanyizQA2026muestras$IXKBS/IHuw7aghRnu37lkuK7r38JrgWLg4YzCVMFfmE=',
 NULL,FALSE,'Prueba ' || lpad(n::text,2,'0'),'Estudiante',FALSE,TRUE,
 now(),'qa-loan-' || lpad(n::text,2,'0') || '@unsa.edu.pe',
 (70001000+n)::text,(80001000+n)::text,'STUDENT','ACTIVO',
 CASE n WHEN 2 THEN current_date + 5
        WHEN 3 THEN current_date + 15
        WHEN 4 THEN current_date + 30
        WHEN 5 THEN current_date - 1
        ELSE NULL END
FROM generate_series(1,12) AS n
ON CONFLICT(email) DO UPDATE SET
  password=EXCLUDED.password,first_name=EXCLUDED.first_name,last_name=EXCLUDED.last_name,
  status='ACTIVO',is_active=TRUE,tipo_usuario='STUDENT',suspendido_hasta=EXCLUDED.suspendido_hasta;

INSERT INTO users (
  password,last_login,is_superuser,first_name,last_name,is_staff,is_active,
  date_joined,email,dni,cui,tipo_usuario,status,suspendido_hasta
) VALUES (
 'pbkdf2_sha256$1000000$loanyizQA2026muestras$IXKBS/IHuw7aghRnu37lkuK7r38JrgWLg4YzCVMFfmE=',
 NULL,TRUE,'Administrador','De Prueba',TRUE,TRUE,
 now(),'qa-loan-admin@unsa.edu.pe','70001999',NULL,'ADMINISTRATOR','ACTIVO',NULL
)
ON CONFLICT(email) DO UPDATE SET
 password=EXCLUDED.password,first_name=EXCLUDED.first_name,last_name=EXCLUDED.last_name,
 is_superuser=TRUE,is_staff=TRUE,is_active=TRUE,status='ACTIVO',tipo_usuario='ADMINISTRATOR';

-- Las políticas son necesarias en BD recién migrada. No sobrescribir políticas existentes.
INSERT INTO politicas_prestamo
 (id,tipo_usuario,dias_maximo_prestamo,max_prestamos_simultaneos,
 dias_suspension_por_dia_retraso,dias_suspension_por_perdida)
VALUES
 (md5('loan-yiz:policy:STUDENT')::uuid,'STUDENT',6,3,2,30),
 (md5('loan-yiz:policy:TEACHER')::uuid,'TEACHER',7,3,2,30),
 (md5('loan-yiz:policy:ADMINISTRATIVE_STAFF')::uuid,'ADMINISTRATIVE_STAFF',10,3,2,30),
 (md5('loan-yiz:policy:ADMINISTRATOR')::uuid,'ADMINISTRATOR',2,3,2,30)
ON CONFLICT (tipo_usuario) DO NOTHING;

INSERT INTO categorias(id,nombre)
VALUES (md5('loan-yiz:categoria:qa')::uuid,'[QA 2026] Biblioteca de pruebas')
ON CONFLICT (id) DO NOTHING;

INSERT INTO fichas_recurso(id,nombre,descripcion,categoria_id,estado_ficha)
SELECT md5('loan-yiz:ficha:' || n)::uuid, nombre,
 'Recurso de prueba para sanciones, préstamos, reserva y cola FIFO; no es material real.',
 md5('loan-yiz:categoria:qa')::uuid, 'ACTIVA'
FROM (VALUES
 (1,'[QA] Álgebra lineal'),
 (2,'[QA] Sistemas operativos'),
 (3,'[QA] Estructuras de datos'),
 (4,'[QA] Redes de computadoras'),
 (5,'[QA] Inteligencia artificial'),
 (6,'[QA] Bases de datos'),
 (7,'[QA] Arquitectura de computadores'),
 (8,'[QA] Cálculo diferencial')
) AS ficha(n,nombre)
ON CONFLICT (id) DO UPDATE SET
 nombre=EXCLUDED.nombre,descripcion=EXCLUDED.descripcion,
 categoria_id=EXCLUDED.categoria_id,estado_ficha='ACTIVA';

-- 28 ejemplares con estado y condición congruentes.
CREATE TEMP TABLE qa_ejemplares (
 codigo text PRIMARY KEY, ficha int NOT NULL, estado text NOT NULL, condicion text NOT NULL
) ON COMMIT DROP;
INSERT INTO qa_ejemplares VALUES
('AL-001',1,'DISPONIBLE','BUENO'),('AL-002',1,'DISPONIBLE','BUENO'),
('AL-003',1,'PRESTADO','BUENO'),('AL-004',1,'PRESTADO','REGULAR'),
('AL-005',1,'DISPONIBLE','BUENO'),
('SO-001',2,'PRESTADO','BUENO'),('SO-002',2,'PRESTADO','BUENO'),
('SO-003',2,'PRESTADO','BUENO'),
('ED-001',3,'DISPONIBLE','BUENO'),('ED-002',3,'DISPONIBLE','BUENO'),
('ED-003',3,'PRESTADO','BUENO'),('ED-004',3,'RESERVADO','BUENO'),
('NET-001',4,'PRESTADO','BUENO'),('NET-002',4,'PRESTADO','BUENO'),
('IA-001',5,'DISPONIBLE','BUENO'),('IA-002',5,'DISPONIBLE','BUENO'),
('IA-003',5,'DISPONIBLE','BUENO'),('IA-004',5,'DISPONIBLE','BUENO'),
('BD-001',6,'DISPONIBLE','BUENO'),('BD-002',6,'RESERVADO','BUENO'),
('BD-003',6,'PRESTADO','BUENO'),
('ARQ-001',7,'DISPONIBLE','BUENO'),('ARQ-002',7,'DISPONIBLE','BUENO'),
('ARQ-003',7,'DADO_DE_BAJA','REGULAR'),
('CAL-001',8,'DISPONIBLE','BUENO'),('CAL-002',8,'DISPONIBLE','BUENO'),
('CAL-003',8,'DISPONIBLE','BUENO'),('CAL-004',8,'EN_MANTENIMIENTO','DANADO');

INSERT INTO ejemplares_fisicos
(id,ficha_recurso_id,codigo_inventario,estado,condicion,condicion_de_ingreso)
SELECT md5('loan-yiz:ejemplar:' || e.codigo)::uuid,
       md5('loan-yiz:ficha:' || e.ficha)::uuid,
       'QA-LS-' || e.codigo, e.estado,e.condicion,
       'Ingresado para pruebas de integración del sistema'
FROM qa_ejemplares e
ON CONFLICT(codigo_inventario) DO UPDATE SET
 estado=EXCLUDED.estado,condicion=EXCLUDED.condicion,
 condicion_de_ingreso=EXCLUDED.condicion_de_ingreso;

-- Prestamos: las fechas están alineadas con los CHECK constraints del ORM.
-- RESERVADO: sin entrega/límite. DEVUELTO: con fecha_devolucion. ACTIVO/VENCIDO/PERDIDO: entrega y límite.
CREATE TEMP TABLE qa_prestamos (
 codigo text, estudiante int, estado text,
 dias_entrega int, dias_limite int, dias_devolucion int,
 renovaciones int DEFAULT 0
) ON COMMIT DROP;
INSERT INTO qa_prestamos VALUES
('AL-003', 7,'ACTIVO',-3,  4,NULL,0),
('AL-004', 7,'ACTIVO',-2,  5,NULL,0),
('AL-005', 2,'DEVUELTO',-14,-6,-1,0),
('SO-001', 6,'VENCIDO',-15,-3,NULL,0),
('SO-002', 1,'ACTIVO',-2,  5,NULL,0),
('SO-003', 7,'ACTIVO',-1,  6,NULL,0),
('ED-003',10,'ACTIVO',-1,  6,NULL,0),
('ED-004',11,'RESERVADO',NULL,NULL,NULL,0),
('NET-001',4,'ACTIVO',-1,  6,NULL,0),
('NET-002',3,'ACTIVO',-2,  5,NULL,0),
('BD-002', 9,'RESERVADO',NULL,NULL,NULL,0),
('BD-003',10,'ACTIVO',-4,  3,NULL,1),
('ARQ-003',12,'PERDIDO',-9,-2,NULL,0);

INSERT INTO prestamos (
 id,usuario_id,ejemplar_fisico_id,fecha_prestamo,fecha_entrega,fecha_limite,
 fecha_devolucion,estado,renovaciones,condicion_entrega,condicion_devolucion,
 observaciones,registrado_por_id
)
SELECT
 md5('loan-yiz:prestamo:' || p.codigo)::uuid,
 u.id,
 md5('loan-yiz:ejemplar:' || p.codigo)::uuid,
 CASE WHEN p.estado='RESERVADO' THEN now()-interval '2 hours' ELSE now()-interval '12 days' END,
 CASE WHEN p.dias_entrega IS NULL THEN NULL ELSE now()+p.dias_entrega * interval '1 day' END,
 CASE WHEN p.dias_limite IS NULL THEN NULL ELSE current_date + p.dias_limite END,
 CASE WHEN p.dias_devolucion IS NULL THEN NULL ELSE current_date + p.dias_devolucion END,
 p.estado,p.renovaciones,
 CASE WHEN p.estado='RESERVADO' THEN NULL ELSE 'BUENO' END,
 CASE WHEN p.estado='DEVUELTO' THEN 'BUENO' ELSE NULL END,
 'Fixture QA; escenario ' || p.estado,admin.id
FROM qa_prestamos p
JOIN users u ON u.email='qa-loan-' || lpad(p.estudiante::text,2,'0') || '@unsa.edu.pe'
JOIN users admin ON admin.email='qa-loan-admin@unsa.edu.pe'
ON CONFLICT(id) DO UPDATE SET
 usuario_id=EXCLUDED.usuario_id,ejemplar_fisico_id=EXCLUDED.ejemplar_fisico_id,
 fecha_prestamo=EXCLUDED.fecha_prestamo,fecha_entrega=EXCLUDED.fecha_entrega,
 fecha_limite=EXCLUDED.fecha_limite,fecha_devolucion=EXCLUDED.fecha_devolucion,
 estado=EXCLUDED.estado,renovaciones=EXCLUDED.renovaciones,
 condicion_entrega=EXCLUDED.condicion_entrega,condicion_devolucion=EXCLUDED.condicion_devolucion,
 observaciones=EXCLUDED.observaciones,registrado_por_id=EXCLUDED.registrado_por_id;

-- La cola solo debe estar ESPERANDO para recursos AGOTADOS (SO y NET).
-- Incluye un sancionado en espera (se sancionó después de anotarse),
-- útil para verificar que el backend lo salta al asignar al primero elegible.
CREATE TEMP TABLE qa_colas (
 clave text, estudiante int, ficha int, horas_antes int, estado text
) ON COMMIT DROP;
INSERT INTO qa_colas VALUES
('SO-1',8,2,8,'ESPERANDO'),('SO-2',9,2,6,'ESPERANDO'),
('NET-1',2,4,10,'ESPERANDO'),('NET-2',5,4,7,'ESPERANDO'),
('NET-3',1,4,2,'ESPERANDO'),
('BD-atendido',9,6,24,'ATENDIDO'),('SO-cancelado',10,2,48,'CANCELADO');
INSERT INTO cola_reservas(id,usuario_id,ficha_recurso_id,fecha_solicitud,estado)
SELECT md5('loan-yiz:cola:' || c.clave)::uuid,u.id,
       md5('loan-yiz:ficha:' || c.ficha)::uuid,
       now() - c.horas_antes * interval '1 hour',c.estado
FROM qa_colas c
JOIN users u ON u.email='qa-loan-' || lpad(c.estudiante::text,2,'0') || '@unsa.edu.pe'
ON CONFLICT(id) DO UPDATE SET
 usuario_id=EXCLUDED.usuario_id,ficha_recurso_id=EXCLUDED.ficha_recurso_id,
 fecha_solicitud=EXCLUDED.fecha_solicitud,estado=EXCLUDED.estado;

COMMIT;

-- Inspección rápida tras ejecutar (ambos conteos pueden crecer con datos reales).
SELECT email,status,suspendido_hasta,
 (suspendido_hasta >= (now() AT TIME ZONE 'America/Lima')::date) AS sancionado
FROM users WHERE email LIKE 'qa-loan-%@unsa.edu.pe' ORDER BY email;
SELECT f.nombre, COUNT(e.id) AS total,
 COUNT(*) FILTER (WHERE e.estado='DISPONIBLE') AS disponibles
FROM fichas_recurso f LEFT JOIN ejemplares_fisicos e ON e.ficha_recurso_id=f.id
WHERE f.nombre LIKE '[QA]%'
GROUP BY f.nombre ORDER BY f.nombre;
SELECT c.estado,f.nombre AS recurso,u.email,c.fecha_solicitud
FROM cola_reservas c JOIN users u ON u.id=c.usuario_id
JOIN fichas_recurso f ON f.id=c.ficha_recurso_id
WHERE u.email LIKE 'qa-loan-%@unsa.edu.pe'
ORDER BY f.nombre,c.fecha_solicitud;
