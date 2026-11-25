-- Loan System Yiz | Datos base y escenarios de pruebas, listas de compañeros y profesores.
-- SOLO para PostgreSQL local de pruebas; ejecutar primero python manage.py migrate.
-- 59 usuarios de las dos listas + superadministrador del dump original.
-- Estudiantes: CUI. Docentes y administrativos: DNI. Administrador: superadmin.
-- Los hashes Argon2 originales fueron verificados; no se regeneran ni se guardan contraseñas en claro.
-- Utiliza las 7 categorias, 22 fichas, 105 ejemplares y 264 prestamos del dump original.
-- En una base recien migrada y sin datos de negocio, carga los datos base y los escenarios.
-- En una base con el dump original intacto, solo agrega los escenarios.
-- Si ya se aplico el seed anterior o hay datos distintos, aborta sin duplicarlos.
-- No copia sesiones ni tokens del dump. No usar con correos reales habilitados.
-- Revision: sincroniza las cuatro politicas de prestamo con el dump tras validar la base.
BEGIN;
SET LOCAL TIME ZONE 'America/Lima';
SET LOCAL standard_conforming_strings = on;
SET LOCAL lock_timeout = '10s';
LOCK TABLE public.users, public.categorias, public.fichas_recurso, public.ejemplares_fisicos,
    public.prestamos, public.cola_reservas, public.politicas_prestamo,
    public.feriados IN SHARE ROW EXCLUSIVE MODE;

-- 1. Cargar datos base solamente cuando no existen usuarios ni datos de catalogo/prestamos.
DO $base$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users)
       AND NOT EXISTS (SELECT 1 FROM public.categorias)
       AND NOT EXISTS (SELECT 1 FROM public.fichas_recurso)
       AND NOT EXISTS (SELECT 1 FROM public.ejemplares_fisicos)
       AND NOT EXISTS (SELECT 1 FROM public.prestamos)
       AND NOT EXISTS (SELECT 1 FROM public.cola_reservas)
       AND NOT EXISTS (SELECT 1 FROM public.feriados) THEN
    INSERT INTO public.users (id, password, last_login, is_superuser, first_name, last_name, is_staff, is_active, date_joined, email, cui, tipo_usuario, status, dni, suspendido_hasta) VALUES
        ('2', 'argon2$argon2id$v=19$m=102400,t=2,p=8$5m9pSlAU5rTk6eqLv14KrHH+q7uCZA$/xJhBklFX9/azAhj4Hpb9J0xjUywEhQt5adz0AW+UeI', '2026-10-21 00:50:41.051705-05', 't', 'superadmin', '', 't', 't', '2026-10-21 00:49:06.529086-05', 'superadmin@unsa.edu.pe', '123', 'ADMINISTRATOR', 'ACTIVO', 'X0000002', NULL),
        ('1', 'argon2$argon2id$v=19$m=102400,t=2,p=8$k9nw6P5mP9uCj1abgltOwIT9tcT5tQ$kAIrpBHiBVRL1K0NSmwJJ5mmfwTJLiWOR0mUB6U4ErY', NULL, 'f', 'YESSENIA DEYSI', 'YARI RAMOS', 'f', 't', '2026-10-07 02:22:52.359968-05', 'yyarira@unsa.edu.pe', NULL, 'TEACHER', 'ACTIVO', '45090070', NULL),
        ('4', 'argon2$argon2id$v=19$m=102400,t=2,p=8$FWKLr6lyRgneQHc6D5xIjE1RYZeQEg$nHs/xg+opGuhTN8kMph3by/S9x9qrRWx2nUk5+s/rEs', NULL, 'f', 'ALVARO HENRY', 'MAMANI ALIAGA', 'f', 't', '2026-10-27 23:17:36.856659-05', 'amamaniali@unsa.edu.pe', NULL, 'TEACHER', 'ACTIVO', '43960619', NULL),
        ('5', 'argon2$argon2id$v=19$m=102400,t=2,p=8$hNulW55h6P/Zk9ivKldpbf0aYxTq1g$YSDRy3SQ1LPv/QcGkUHJrsCMa0tf2JRQvLAieG86FmM', NULL, 'f', 'JUAN CARLOS', 'GUTIERREZ CACERES', 'f', 't', '2026-11-04 01:14:08.679203-05', 'jgutierrezca@unsa.edu.pe', NULL, 'TEACHER', 'ACTIVO', '47008530', NULL),
        ('9', 'argon2$argon2id$v=19$m=102400,t=2,p=8$zHbWgNf4XTwadChvT+cEPM9OgfTWEg$5PIB1ACL0eac50wRHL0lsy6qonsRljkQ3fTmsAeE0p8', NULL, 'f', 'EDGAR', 'SARMIENTO CALISAYA', 'f', 't', '2026-11-16 22:06:44.212058-05', 'esarmientoca@unsa.edu.pe', NULL, 'TEACHER', 'ACTIVO', '42382703', NULL),
        ('3', 'argon2$argon2id$v=19$m=102400,t=2,p=8$O7sjeK2caXqeuaC31ZxJUVuH0DFhHg$2juxpF1KjXXNKNSqStiQnpQ1hwxu46eKA6gAbpPN844', NULL, 'f', 'DANIELA', 'CCOPA HANCCO', 'f', 't', '2026-10-21 01:22:24.912028-05', 'dccopah@unsa.edu.pe', NULL, 'ADMINISTRATIVE_STAFF', 'ACTIVO', '44148304', NULL),
        ('6', 'argon2$argon2id$v=19$m=102400,t=2,p=8$8gV2f91+/CT7QavCqrWPNmnJcDX/pA$V7WtByCU/Yc9YtST8d23c8mjnW6v7mTbwILAwoL+09Y', NULL, 'f', 'ANGELO JOSUE', 'QUISPE SUAREZ', 'f', 't', '2026-11-04 06:02:26.123716-05', 'aquispesua@unsa.edu.pe', '20243463', 'STUDENT', 'ACTIVO', '76787738', NULL),
        ('8', 'argon2$argon2id$v=19$m=102400,t=2,p=8$eBaOsJCaSBGinbi8wnLD9BgGw8ZvcA$JL8ElBh7QLv7yikO3jU0e/zDtkaZUwVBgjg5ijrhKXg', NULL, 'f', 'JESUS ALBERTO', 'ALFARO BUIZA', 'f', 't', '2026-11-16 22:06:44.205214-05', 'jalfarob@unsa.edu.pe', '20232283', 'STUDENT', 'ACTIVO', '75927066', NULL),
        ('10', 'argon2$argon2id$v=19$m=102400,t=2,p=8$mshlYJoruw3Jm9Ka5CikHAXmjKFBtQ$PUjFHwyVyuyoq7QrdM8g6PetIKnoAJ8Yb5Sm3Wakaf0', NULL, 'f', 'MARCO ANTONIO', 'ARMENDARIZ PAREDES', 'f', 't', '2026-11-25 06:12:24.024109-05', 'marmendariz@unsa.edu.pe', '20233375', 'STUDENT', 'ACTIVO', '75787507', NULL),
        ('11', 'argon2$argon2id$v=19$m=102400,t=2,p=8$e8yoalsw66UFCW7WDKtSK7yP5zcMxg$XEJ6tFxjO4ln9PEskBT/oXZR4Sw/TpryZ52bvt/uFm0', NULL, 'f', 'ALBERT GUSSEPE', 'BLANCO CANA', 'f', 't', '2026-11-25 06:12:24.024109-05', 'ablancoc@unsa.edu.pe', '20200719', 'STUDENT', 'ACTIVO', '70471497', NULL),
        ('12', 'argon2$argon2id$v=19$m=102400,t=2,p=8$98Tg7k12uLV4ES0H/Nav7COJ2pCICQ$e/RXKSln0qoCTPZMNiLkuPblgpyE3SlmaiLP7m7WZzM', NULL, 'f', 'KARINA PAOLA', 'CALCINA CHUQUIPALLA', 'f', 't', '2026-11-25 06:12:24.024109-05', 'kcalcinac@unsa.edu.pe', '20243472', 'STUDENT', 'ACTIVO', '74974459', NULL),
        ('13', 'argon2$argon2id$v=19$m=102400,t=2,p=8$dvmhsesWd2RFULK37ME3noEkSkLjGA$jhVAM+f6pYyl1AVSkN5JvhqDn0ZGcWFKoq8iUFeuU60', NULL, 'f', 'DIEGO', 'CANQUI ECOS', 'f', 't', '2026-11-25 06:12:24.024109-05', 'dcanqui@unsa.edu.pe', '20243465', 'STUDENT', 'ACTIVO', '70584529', NULL),
        ('14', 'argon2$argon2id$v=19$m=102400,t=2,p=8$QWO6bTqDuItGzCREmHw78UuRPDif9Q$vXSz2oUPBJa8rF+lN8A5vz0jDZ9JAlyXymg2ukGw3Jw', NULL, 'f', 'ANDERSON SAMUEL', 'CARPIO CHURA', 'f', 't', '2026-11-25 06:12:24.024109-05', 'acarpioch@unsa.edu.pe', '20213148', 'STUDENT', 'ACTIVO', '77025941', NULL),
        ('15', 'argon2$argon2id$v=19$m=102400,t=2,p=8$EnOJwk5ErxYIPicH/oKOmzCnXNq5nA$Bxs8rweTiJZAdZnKUUFaD7SD5ZhwnxnXB9M0a1XlS/g', NULL, 'f', 'MOISES ROBERT', 'CCASO IDME', 'f', 't', '2026-11-25 06:12:24.024109-05', 'mccasoi@unsa.edu.pe', '20240826', 'STUDENT', 'ACTIVO', '61522668', NULL),
        ('16', 'argon2$argon2id$v=19$m=102400,t=2,p=8$BSuS8PtwK6jaDEv0ZgVd++ZvIePA8g$ntTCmCnMVsfi+6nzTW4PlnD9Imd5hRqvU+8zfXNz5fY', NULL, 'f', 'ELYUD EDGAR', 'CHAYÑA CALCINA', 'f', 't', '2026-11-25 06:12:24.024109-05', 'echaynac@unsa.edu.pe', '20240827', 'STUDENT', 'ACTIVO', '74885499', NULL),
        ('17', 'argon2$argon2id$v=19$m=102400,t=2,p=8$heleblY8m9uzDG3FMUOhX/3f8Tu7UA$dVEcRebYAwZ66P0mjvWSs2ne2DpnebF9HvdcsXsGcEE', NULL, 'f', 'LUIS ANTONIO', 'CHIPANA CHURA', 'f', 't', '2026-11-25 06:12:24.024109-05', 'lchipanac@unsa.edu.pe', '20223114', 'STUDENT', 'ACTIVO', '73803027', NULL),
        ('18', 'argon2$argon2id$v=19$m=102400,t=2,p=8$WUfhiNDOFwmDMNcPyO94SvGygXxZ2A$R/bzEf9etn0R3ZXfgNqmK8FNFIilCC0OXZ7o0l7dSB4', NULL, 'f', 'ALDAIR DANIEL', 'CONDORI ATAUCURI', 'f', 't', '2026-11-25 06:12:24.024109-05', 'acondoriat@unsa.edu.pe', '20233580', 'STUDENT', 'ACTIVO', '73492873', NULL),
        ('19', 'argon2$argon2id$v=19$m=102400,t=2,p=8$wkrA3sQHszh98tpoB2caTxpWXo155Q$79RoS0bPKCZ3V0n0eXnBXWeIfd+CWsIOBUxgKwX7HFs', NULL, 'f', 'EMILIO ALEJANDRO', 'CONDORI PALLARDEL', 'f', 't', '2026-11-25 06:12:24.024109-05', 'econdoripal@unsa.edu.pe', '20240845', 'STUDENT', 'ACTIVO', '72586988', NULL),
        ('20', 'argon2$argon2id$v=19$m=102400,t=2,p=8$ldmcIV18CjRp3orD/jLWIVGDfMPKJA$WnXNnfY/hbykLSwpdZSicykdNiq9QlnZTaAbxXKsUfE', NULL, 'f', 'STEPHANO GIAN PIERRE', 'DELGADO CHAVEZ', 'f', 't', '2026-11-25 06:12:24.024109-05', 'sdelgadoch@unsa.edu.pe', '20242427', 'STUDENT', 'ACTIVO', '73454103', NULL),
        ('21', 'argon2$argon2id$v=19$m=102400,t=2,p=8$7VIlTyPKxOog4DN7FZwagODGeS+QUQ$8XjIcitL+BZD72JD5jPfjH5IXgCC//uBWSyQeTdE57k', NULL, 'f', 'MAURICIO ALEJANDRO', 'FARFAN HUAYTA', 'f', 't', '2026-11-25 06:12:24.024109-05', 'mfarfanhu@unsa.edu.pe', '20200736', 'STUDENT', 'ACTIVO', '60842580', NULL),
        ('22', 'argon2$argon2id$v=19$m=102400,t=2,p=8$h5I3TPC9WboQXwmamNiEmv/eVG39jQ$fAkg7sXrX2hHmt5Vd84OatVF0G/QW9e93vRkQq5jskw', NULL, 'f', 'FERNANDO ANTONIO', 'GAMA LLICAHUA', 'f', 't', '2026-11-25 06:12:24.024109-05', 'fgama@unsa.edu.pe', '20240830', 'STUDENT', 'ACTIVO', '76803946', NULL),
        ('23', 'argon2$argon2id$v=19$m=102400,t=2,p=8$loPjc0bNvsmkzkn5MHNu5npoeNK/Zg$1I/TtDwcptw4+TeQgnQY7It1QsDti/Z8XD9YHsMegV8', NULL, 'f', 'CARLOS ENRIQUE', 'GUTIERREZ CASTILLA', 'f', 't', '2026-11-25 06:12:24.024109-05', 'cgutierrezca@unsa.edu.pe', '20240831', 'STUDENT', 'ACTIVO', '60961346', NULL),
        ('24', 'argon2$argon2id$v=19$m=102400,t=2,p=8$U5aBsc9/rLLMf4Mk0Y7Xr4SxrGGqfA$2EZf2SP5F6IGiqW3LIH8vMQmgz59ALBoAO9MMmnm0xA', NULL, 'f', 'JOHAN DIEGO', 'HUAMANI SABINA', 'f', 't', '2026-11-25 06:12:24.024109-05', 'jhuamanisab@unsa.edu.pe', '20242426', 'STUDENT', 'ACTIVO', '73966756', NULL),
        ('25', 'argon2$argon2id$v=19$m=102400,t=2,p=8$UqklE1HSQOLC3DCUQuI/+zDmXWjRaw$X9MFHh6xS3SIweJs+F0/kuHfVFWTZlNQUuacLA/gSws', NULL, 'f', 'ESTRELLA DE JESÚS EMILIA FABIANA', 'HUARSAYA MÁRQUEZ', 'f', 't', '2026-11-25 06:12:24.024109-05', 'ehuarsaya@unsa.edu.pe', '20240834', 'STUDENT', 'ACTIVO', '77101358', NULL),
        ('26', 'argon2$argon2id$v=19$m=102400,t=2,p=8$7Y8NW6Mmty2QuN2Z1aMLehg6ucN7LQ$msFwY/y52V9FeQy+8/Kz0JeF0IBRDZpZEk5sX2GIwiU', NULL, 'f', 'LIZZY ARLETTE', 'HUAYHUA PEREZ', 'f', 't', '2026-11-25 06:12:24.024109-05', 'huayhuape@unsa.edu.pe', '20240829', 'STUDENT', 'ACTIVO', '72473149', NULL),
        ('27', 'argon2$argon2id$v=19$m=102400,t=2,p=8$lv0eS3BOqlRbW2RqRrIpEVYU1Pn+Zw$goL2UrlnlzJ+rhdkuYlgq0RE8ogOEOLK2HIUg7mZxoM', NULL, 'f', 'ROID NIRO', 'HUAYLLA GUZMAN', 'f', 't', '2026-11-25 06:12:24.024109-05', 'rhuayllag@unsa.edu.pe', '20240835', 'STUDENT', 'ACTIVO', '70788377', NULL),
        ('28', 'argon2$argon2id$v=19$m=102400,t=2,p=8$qQduzPqmv1Oroa8e+BfSpleB3zQG7A$muQYSVn3eCeby8hU+Rez12zxwzXVHo7K+/JSapo/cCM', NULL, 'f', 'DAYSI', 'JARA ARISACA', 'f', 't', '2026-11-25 06:12:24.024109-05', 'djaraa@unsa.edu.pe', '20232278', 'STUDENT', 'ACTIVO', '76602179', NULL),
        ('29', 'argon2$argon2id$v=19$m=102400,t=2,p=8$0ALtj1nIQbICWlx1dRAoE7m3NBroeA$gcGY48rebnGTqn2rfCbv2k+GyTLxDuTiJRAXRDN3hXw', NULL, 'f', 'HELLEN GRACE', 'JUAN DE DIOS DELGADO', 'f', 't', '2026-11-25 06:12:24.024109-05', 'hjuandedios@unsa.edu.pe', '20233584', 'STUDENT', 'ACTIVO', '73627191', NULL),
        ('30', 'argon2$argon2id$v=19$m=102400,t=2,p=8$t82VArnFGL5cwAm3yYfnaYrEE4jjtw$GJyfJ9yDVwKqGyCSbIBCphGoIgA9/7m5N/uYpVAVdpU', NULL, 'f', 'NATALIE MARLENY', 'LAZO PAXI', 'f', 't', '2026-11-25 06:12:24.024109-05', 'nlazop@unsa.edu.pe', '20213147', 'STUDENT', 'ACTIVO', '72532364', NULL),
        ('31', 'argon2$argon2id$v=19$m=102400,t=2,p=8$Sg2osiBleB6g2t3EJMuv+B4mSwa/mw$f+kVYVq2O6ai0MHIyGVNHiNFQWPu+5AShLE+cJ/ygMA', NULL, 'f', 'FERNANDO ENRIQUE', 'LLOSA MANCHEGO', 'f', 't', '2026-11-25 06:12:24.024109-05', 'fllosam@unsa.edu.pe', '20233591', 'STUDENT', 'ACTIVO', '70408260', NULL),
        ('32', 'argon2$argon2id$v=19$m=102400,t=2,p=8$c1Dqh+gBy48f0H1e2R+kGlnAnrt8mg$SStifb4bW20miuWk3U1V7vzBnW3WiZCuzTuRUb2fn2E', NULL, 'f', 'MARIANA VALERY', 'LUIS JIMENEZ', 'f', 't', '2026-11-25 06:12:24.024109-05', 'mluisj@unsa.edu.pe', '20223084', 'STUDENT', 'ACTIVO', '72535180', NULL),
        ('33', 'argon2$argon2id$v=19$m=102400,t=2,p=8$6tupovjss26/Zw3s2rlfSmSBmpo8sQ$hW1FHkH39pq0r3955FIeFTot9lDlpKge3cvd/AMOSHk', NULL, 'f', 'DIEGO DE ALESSANDRO', 'MAMANI SALAZAR', 'f', 't', '2026-11-25 06:12:24.024109-05', 'dmamanisal@unsa.edu.pe', '20243469', 'STUDENT', 'ACTIVO', '75994870', NULL),
        ('34', 'argon2$argon2id$v=19$m=102400,t=2,p=8$CWHCGXnE+1ZwRuqmNL6z21kbZGQklQ$Af31EGdU8msWaw11GymsvtrotpqdTuy3RkmY0T/1NUI', NULL, 'f', 'LUIS FERNANDO', 'MORALES TACCA', 'f', 't', '2026-11-25 06:12:24.024109-05', 'lmoralest@unsa.edu.pe', '20153703', 'STUDENT', 'ACTIVO', '60653622', NULL),
        ('35', 'argon2$argon2id$v=19$m=102400,t=2,p=8$VqQVzLbw8YIpDHwDoeYZgUyPreSYEw$kHBPtMg/ibAEet8uL2KMvfUnJ7A+SWAoZYti7Ft+RZQ', NULL, 'f', 'NEILL ELVERTH', 'OLAZABAL CHAVEZ', 'f', 't', '2026-11-25 06:12:24.024109-05', 'nolazabalc@unsa.edu.pe', '20210680', 'STUDENT', 'ACTIVO', '73035811', NULL),
        ('36', 'argon2$argon2id$v=19$m=102400,t=2,p=8$NOnBIY8EYCpf+SmzM3EiWHliTngEtg$amw7lrtkJzVH4+sBjFAVgiyb1SzsUoDAvm3sfwqrbXs', NULL, 'f', 'ALVARO JOHAN', 'PANIBRA CHOCTAYA', 'f', 't', '2026-11-25 06:12:24.024109-05', 'apanibrach@unsa.edu.pe', '20151100', 'STUDENT', 'ACTIVO', '73910263', NULL),
        ('37', 'argon2$argon2id$v=19$m=102400,t=2,p=8$IMOF1Uv5L6ZvjGO5sU3VXSBeWi4GUg$4b6u+yyWaNFIgxhto1t2rXv0mwNUg8kdfWUglIEN4v0', NULL, 'f', 'JAVIER ALONZO', 'PEÑALVA HUMIRE', 'f', 't', '2026-11-25 06:12:24.024109-05', 'jpenalvah@unsa.edu.pe', '20152574', 'STUDENT', 'ACTIVO', '76823560', NULL),
        ('38', 'argon2$argon2id$v=19$m=102400,t=2,p=8$q9+XSOvuDffJgusfgddX6snjQBTzkg$Q1bVNRu1kb3FopsSwbxot6wXkpAQeqDE9BRq7pqhuQE', NULL, 'f', 'JESUS GUSTAVO', 'PEREZ VILLASANTE', 'f', 't', '2026-11-25 06:12:24.024109-05', 'jperezvil@unsa.edu.pe', '20240839', 'STUDENT', 'ACTIVO', '61434201', NULL),
        ('39', 'argon2$argon2id$v=19$m=102400,t=2,p=8$1lJ5CpEAwroArzni4LurhKrJOlXLtg$ir5K6zGCOIRd7xdZAvyBDrog3E5AHCDieVDrykvXNzk', NULL, 'f', 'JUAN CARLOS', 'POSTIGO CABANA', 'f', 't', '2026-11-25 06:12:24.024109-05', 'jpostigo@unsa.edu.pe', '20162924', 'STUDENT', 'ACTIVO', '75818149', NULL),
        ('40', 'argon2$argon2id$v=19$m=102400,t=2,p=8$BHi803C/fsCQydei/hXtVdFybg42Eg$9lNag2RU2Qda1cWRR+ffj45RJ1pNdFGVsvadWoNhZV8', NULL, 'f', 'CLAUDIA ROXANA', 'QUISOCALA CRUZ', 'f', 't', '2026-11-25 06:12:24.024109-05', 'cquisocalac@unsa.edu.pe', '20172351', 'STUDENT', 'ACTIVO', '72552863', NULL),
        ('41', 'argon2$argon2id$v=19$m=102400,t=2,p=8$IBbii/Yj2gXNdiLNNsO9AuFKe9mlqQ$Ff9LwSX2TJ3YQgWZpp88eFe2hRQEzIkEu5YFz2JVBCM', NULL, 'f', 'SHARMELY YESENIA', 'QUISPE CHAVEZ', 'f', 't', '2026-11-25 06:12:24.024109-05', 'squispechav@unsa.edu.pe', '20151600', 'STUDENT', 'ACTIVO', '75677043', NULL),
        ('42', 'argon2$argon2id$v=19$m=102400,t=2,p=8$D9eyqFCkxuSXTB03s4Rayfa40C81Fg$FQ2QKdNEfxeYydtxJ3tWK1JCpuSFFaPT63+me4K28AI', NULL, 'f', 'DAVID AUGUSTO', 'QUISPE LLOCCALLASI', 'f', 't', '2026-11-25 06:12:24.024109-05', 'dquispello@unsa.edu.pe', '20243473', 'STUDENT', 'ACTIVO', '76368785', NULL),
        ('43', 'argon2$argon2id$v=19$m=102400,t=2,p=8$ZJsE57hZKhYrzJ6hfxPTbJiKi7jItg$MOSWtfNmwW3tzS1g6KcRAx7Hm3rd8Zcl2n28LMbDlI4', NULL, 'f', 'JOB LORENZO', 'QUISPE TORREZ', 'f', 't', '2026-11-25 06:12:24.024109-05', 'jquispetor@unsa.edu.pe', '20240841', 'STUDENT', 'ACTIVO', '73106384', NULL),
        ('44', 'argon2$argon2id$v=19$m=102400,t=2,p=8$qXJqhKjCdw1C4OTvfhb7gwou/s1C1g$6f8toy0dCYihC4/V+J2m/sWbRNMm4XxTq9nL6x3xpa4', NULL, 'f', 'LUIS ENRIQUE', 'RAMOS CHAMBI', 'f', 't', '2026-11-25 06:12:24.024109-05', 'lramoscha@unsa.edu.pe', '20220721', 'STUDENT', 'ACTIVO', '76677321', NULL),
        ('45', 'argon2$argon2id$v=19$m=102400,t=2,p=8$DcEoZYQtHp9nSqinJ5njRmU2V4oN/Q$oSA7fcICOQtoSVB7uTTh5aH/hkglkrUZ9GcFmTQ0Uao', NULL, 'f', 'RODRIGO ABRAHAM', 'RAMOS MAMANI', 'f', 't', '2026-11-25 06:12:24.024109-05', 'rramosmam@unsa.edu.pe', '20240842', 'STUDENT', 'ACTIVO', '72169230', NULL),
        ('46', 'argon2$argon2id$v=19$m=102400,t=2,p=8$J5aZtf4LxqQjSlvmExXUQt0JSKVHwg$ZVniHNqe0/LlKiWjCKGof5zksOFDUMwdc+mJ3zeNbNI', NULL, 'f', 'OMAR JOAQUIN', 'RIVERA OLIVERA', 'f', 't', '2026-11-25 06:12:24.024109-05', 'oriverao@unsa.edu.pe', '20243468', 'STUDENT', 'ACTIVO', '75016179', NULL),
        ('47', 'argon2$argon2id$v=19$m=102400,t=2,p=8$4ItZWsMZ+9rLCxabK75S3rAqrR48Yw$C2k1+hySWrYwiI49DA/i3/ZXsw01iN8V2f8vC6SJQk8', NULL, 'f', 'EDU ANDRE', 'SUCARI CCANSAYA', 'f', 't', '2026-11-25 06:12:24.024109-05', 'esucari@unsa.edu.pe', '20240828', 'STUDENT', 'ACTIVO', '76981583', NULL),
        ('48', 'argon2$argon2id$v=19$m=102400,t=2,p=8$2F9PXs+YMMaXjrdVuR0N5A9dkSohwQ$lN2UdsC/WbS6fyq7DTkjpllwC3pJGltWRs8vKhinpeE', NULL, 'f', 'CRISTHIAN LUIS', 'TAIPE HUANCA', 'f', 't', '2026-11-25 06:12:24.024109-05', 'ctaipe@unsa.edu.pe', '20190224', 'STUDENT', 'ACTIVO', '70969664', NULL),
        ('49', 'argon2$argon2id$v=19$m=102400,t=2,p=8$8SR+0+LeeWWcMUF5xfOqCR2UM4CNNg$KaJBUWoih3k/AbABngNG+UeMdrDpbqKflt1G9FWV+XA', NULL, 'f', 'LIZETH ANGELICA', 'TITO VILCA', 'f', 't', '2026-11-25 06:12:24.024109-05', 'ltitov@unsa.edu.pe', '20233592', 'STUDENT', 'ACTIVO', '72903139', NULL),
        ('50', 'argon2$argon2id$v=19$m=102400,t=2,p=8$676n1WMbU1s5f7u3ibXXc0ZZFDHGxw$A+4V+3r5DnICM+s9IkxZZ3dWiTJSSj9pi8hlyDKo+Qk', NULL, 'f', 'JHAIR ALEJANDRO', 'TORRES CHAVEZ', 'f', 't', '2026-11-25 06:12:24.024109-05', 'jtorreschav@unsa.edu.pe', '20231499', 'STUDENT', 'ACTIVO', '72771109', NULL),
        ('51', 'argon2$argon2id$v=19$m=102400,t=2,p=8$csU0CCgGIbl01Cu6KdGZkdgDSo+hcA$4wANLFKG9YeghGB2OT/uH8V3eiM3WUrYQKhr5/yXM6k', NULL, 'f', 'MICAELA BELEN', 'URIBE ZUÑIGA', 'f', 't', '2026-11-25 06:12:24.024109-05', 'muribez@unsa.edu.pe', '20222070', 'STUDENT', 'ACTIVO', '74805194', NULL),
        ('52', 'argon2$argon2id$v=19$m=102400,t=2,p=8$J/XdhkeBrO5hVwSxGq7+lU2/puDkJg$kga/to2zkDWJKQb7PS/V4PnVsOrpRJ5o0IIE1++n0R8', NULL, 'f', 'RONALD REYNALDO', 'VALDEZ AGÜERO', 'f', 't', '2026-11-25 06:12:24.024109-05', 'rvaldeza@unsa.edu.pe', '20163274', 'STUDENT', 'ACTIVO', '76058872', NULL),
        ('53', 'argon2$argon2id$v=19$m=102400,t=2,p=8$BsHPKY4h6duEkm/QSToUgP/NoCQBmA$3nAFhWwrWF5FEwnshtY1xXbBI3jODDpuglHiV7/XRtc', NULL, 'f', 'DIEGO MAURICIO', 'VILLANUEVA FLORES', 'f', 't', '2026-11-25 06:12:24.024109-05', 'dvillanuevaf@unsa.edu.pe', '20240836', 'STUDENT', 'ACTIVO', '77625950', NULL),
        ('54', 'argon2$argon2id$v=19$m=102400,t=2,p=8$qY31bg0FuagOTRGLhaMsg7p9u5GTwg$qoyQH3i0Lbte++zS6Q6pyKObVdRuEgo8fiyUH7L6j4s', NULL, 'f', 'MARVING ALONZO', 'ZAMATA HUARACHA', 'f', 't', '2026-11-25 06:12:24.024109-05', 'mzamatah@unsa.edu.pe', '20053497', 'STUDENT', 'ACTIVO', '60250930', NULL),
        ('55', 'argon2$argon2id$v=19$m=102400,t=2,p=8$x3eqcqO/O9a7MevcMHKDYEOgoDC4hA$2LCuQU1HeWxiqN71anEKHj2aGT6PagfrJqimtNAm0QQ', NULL, 'f', 'EDUARDO JOSUE', 'ZELA QUISPE', 'f', 't', '2026-11-25 06:12:24.024109-05', 'ezelaquisp@unsa.edu.pe', '20240847', 'STUDENT', 'ACTIVO', '61416136', NULL),
        ('56', 'argon2$argon2id$v=19$m=102400,t=2,p=8$GGC4gOTFj/HWpJHtmtjAG1r8C4QGVQ$jXz+Rn5INdI2LtrWAiOoPLpwVQV1fUujXOl0Q1i1lqI', NULL, 'f', 'EDWARD', 'HINOJOSA CARDENAS', 'f', 't', '2026-11-25 06:12:24.024109-05', 'ehinojosa@unsa.edu.pe', NULL, 'TEACHER', 'ACTIVO', '42927584', NULL),
        ('57', 'argon2$argon2id$v=19$m=102400,t=2,p=8$wo2091S8yjUxLz0en+P3DfVOO5PisQ$wozHYOnX6EOakNtB6f+Rs5rXmqq3H0UuoQ1OVwi1g4I', NULL, 'f', 'ANA MARIA', 'CUADROS VALDIVIA', 'f', 't', '2026-11-25 06:12:24.024109-05', 'acuadrosv@unsa.edu.pe', NULL, 'TEACHER', 'ACTIVO', '46156667', NULL),
        ('58', 'argon2$argon2id$v=19$m=102400,t=2,p=8$opxpPN9qXbFrN1v4T8CNG/0JwhYqiQ$WGy+ls/7URXhndqNV02qLg3be/pWVD39g78coNRYFOc', NULL, 'f', 'WILBER ROBERTO', 'RAMOS LOVON', 'f', 't', '2026-11-25 06:12:24.024109-05', 'wramos@unsa.edu.pe', NULL, 'TEACHER', 'ACTIVO', '42133924', NULL),
        ('59', 'argon2$argon2id$v=19$m=102400,t=2,p=8$bjnh0CL/RgX7Youb+NSwPYL6DUMhhA$C1xKt1vItTDDXdUSQrOha+1L/xcG2xT4ugbJNQdk3Ww', NULL, 'f', 'ROXANA', 'FLORES QUISPE', 'f', 't', '2026-11-25 06:12:24.024109-05', 'rfloresqu@unsa.edu.pe', NULL, 'TEACHER', 'ACTIVO', '45730307', NULL),
        ('60', 'argon2$argon2id$v=19$m=102400,t=2,p=8$3c/4kIjewYJGtoKwcc8ROfG1WCsyFQ$PIFDkgSoLamwRJxa7KR5fX+K+Zn/biWEIbhvfSLoSYA', NULL, 'f', 'YUBER ELMER', 'VELAZCO PAREDES', 'f', 't', '2026-11-25 06:12:24.024109-05', 'yvelazco@unsa.edu.pe', NULL, 'TEACHER', 'ACTIVO', '45929632', NULL),
        ('61', 'argon2$argon2id$v=19$m=102400,t=2,p=8$pvRb1tV5aHvEYyTWGh+cG0DQiwyixA$fj5q8SztFDe8BELvPEx53MlDioMysCLJrG43fZUtiJ4', NULL, 'f', 'HETMITH', 'HANCCO TANCAYLLO', 'f', 't', '2026-11-25 06:12:24.024109-05', 'hhanccot@unsa.edu.pe', NULL, 'ADMINISTRATIVE_STAFF', 'ACTIVO', '43551541', NULL);
    INSERT INTO public.categorias (id, nombre) VALUES
        ('6bce7325-6eb4-47d1-8370-f6e0997fb511', 'Computadora'),
        ('cb5aaf47-f6fe-4853-a8a5-e123a9ab5296', 'Libros'),
        ('066d3b52-77cf-4804-8044-e50f485565a8', 'Tecnologia'),
        ('dad8f658-3517-44ce-9545-630980b5c5e1', 'Material Educativo'),
        ('1597a132-de84-4057-9498-59ad2b9e5e66', 'Robotica e Innovacion'),
        ('fd7e17a0-8d64-4b54-bc73-ae4f6f2969d2', 'Laboratorio'),
        ('d3fe1570-7e07-4ff4-8b7a-2ba7c747ceab', 'Material Deportivo');
    INSERT INTO public.fichas_recurso (id, nombre, descripcion, estado_ficha, categoria_id) VALUES
        ('0b6d4c8a-adc0-4aa9-949a-d76d2781b521', 'Laptop HP AI 15-fd2351la', 'Intel Core Ultra 5, 8 GB RAM, 512 GB SSD, 15.6" Táctil FHD, Windows 11 Home', 'ACTIVA', '6bce7325-6eb4-47d1-8370-f6e0997fb511'),
        ('1d745bec-a0b2-4674-a9e9-bb4009e1f3c1', 'Don Quijote de la Mancha', 'Edicion de consulta para lectura y literatura.', 'ACTIVA', 'cb5aaf47-f6fe-4853-a8a5-e123a9ab5296'),
        ('c679009f-e842-427c-892d-b1694f0325b3', 'Tradiciones Peruanas', 'Coleccion de relatos de Ricardo Palma.', 'ACTIVA', 'cb5aaf47-f6fe-4853-a8a5-e123a9ab5296'),
        ('c32ad0c8-7c23-4529-9133-a7817277ea7f', 'Kit de robotica educativa', 'Kit para practicas de electronica y robotica.', 'ACTIVA', '1597a132-de84-4057-9498-59ad2b9e5e66'),
        ('ae6a7d0b-ce25-40f6-becf-e6d4c18d3f64', 'Microscopio escolar', 'Microscopio para practicas de ciencias naturales.', 'ACTIVA', 'fd7e17a0-8d64-4b54-bc73-ae4f6f2969d2'),
        ('5639214a-7834-4c9d-814b-5404c40a932b', 'Laptop de laboratorio', 'Equipo portatil para practicas de programacion.', 'ACTIVA', '066d3b52-77cf-4804-8044-e50f485565a8'),
        ('d8988724-eaa5-4d5b-84ab-778314ceeab3', 'Calculadora cientifica', 'Calculadora para cursos de matematica y fisica.', 'ACTIVA', 'dad8f658-3517-44ce-9545-630980b5c5e1'),
        ('16f2c87e-9c92-4f53-96ae-138792accccb', 'Oculus Quest 3', 'Visor de realidad virtual para practicas de innovacion y laboratorio.', 'ACTIVA', '066d3b52-77cf-4804-8044-e50f485565a8'),
        ('346e47f7-a715-4a64-a0e0-c352fe5476ba', 'Tablet Samsung Galaxy Tab A9', 'Tablet de 11 pulgadas para lectura y practicas.', 'ACTIVA', '6bce7325-6eb4-47d1-8370-f6e0997fb511'),
        ('831f38ab-fd18-4dd1-9302-d34c3e0ac289', 'Balanza digital de precision', 'Balanza de laboratorio con precision de 0.01 g.', 'ACTIVA', 'fd7e17a0-8d64-4b54-bc73-ae4f6f2969d2'),
        ('9747fcb3-298f-4137-91ee-67300328a31b', 'Cien anos de soledad', 'Novela de Gabriel Garcia Marquez, edicion de consulta.', 'ACTIVA', 'cb5aaf47-f6fe-4853-a8a5-e123a9ab5296'),
        ('fd94100b-bf80-4980-a878-6efe4a8f94ae', 'Demo - Manual de prestamo', 'Recurso de demostracion para reportes.', 'ACTIVA', 'cb5aaf47-f6fe-4853-a8a5-e123a9ab5296'),
        ('6bec9443-b0f8-47c1-a97c-b96b35e3968f', 'Demo - Kit portatil', 'Recurso de demostracion para reportes.', 'ACTIVA', '6bce7325-6eb4-47d1-8370-f6e0997fb511'),
        ('51cad05b-8c49-4dfa-8309-ffc224bb2a44', 'Proyector multimedia Epson', 'Proyector HDMI de 3600 lumenes para clases y exposiciones.', 'ACTIVA', '066d3b52-77cf-4804-8044-e50f485565a8'),
        ('f2f91f4b-de82-4cc9-95b2-b113f61e0668', 'Camara fotografica Canon', 'Camara digital reflex con lente 18-55 mm.', 'ACTIVA', '066d3b52-77cf-4804-8044-e50f485565a8'),
        ('82a631fe-0985-467b-9064-31da6466db84', 'Laptop Lenovo IdeaPad 3', 'Ryzen 5, 8 GB RAM, 256 GB SSD, pantalla de 15.6 pulgadas.', 'ACTIVA', '6bce7325-6eb4-47d1-8370-f6e0997fb511'),
        ('bafc250a-bdc7-476e-8653-bb9082cfe1d6', 'Kit de quimica basica', 'Juego de material de vidrio para practicas de quimica.', 'ACTIVA', 'fd7e17a0-8d64-4b54-bc73-ae4f6f2969d2'),
        ('4696b813-f219-466e-8cd2-55670b0537af', 'La ciudad y los perros', 'Novela de Mario Vargas Llosa, edicion de consulta.', 'ACTIVA', 'cb5aaf47-f6fe-4853-a8a5-e123a9ab5296'),
        ('23e794bd-06bc-46be-a371-c4d8c51f4036', 'Atlas geografico del Peru', 'Atlas escolar con mapas fisicos y politicos.', 'ACTIVA', 'dad8f658-3517-44ce-9545-630980b5c5e1'),
        ('ed0a406d-fb71-4606-a3c5-7eabc4704a2c', 'Impresora 3D Ender 3', 'Impresora 3D FDM para prototipos y practicas de innovacion.', 'ACTIVA', '1597a132-de84-4057-9498-59ad2b9e5e66'),
        ('dfb32c48-8d68-4631-a14d-024690e03148', 'Balon de futbol N5', 'Balon de futbol tamano 5.', 'ACTIVA', 'd3fe1570-7e07-4ff4-8b7a-2ba7c747ceab'),
        ('769278d1-b5f9-413f-aa9f-c1b52fdd8968', 'Set de ajedrez de torneo', 'Tablero y piezas reglamentarias.', 'ACTIVA', 'd3fe1570-7e07-4ff4-8b7a-2ba7c747ceab');
    INSERT INTO public.ejemplares_fisicos (id, codigo_inventario, estado, condicion, ficha_recurso_id, condicion_de_ingreso) VALUES
        ('454fae03-3e05-4e1c-9e58-e1876fa60bd6', 'TEC-LAB-001', 'DISPONIBLE', 'REGULAR', '5639214a-7834-4c9d-814b-5404c40a932b', 'Al ingreso se registró en buen estado y sin daños aparentes.'),
        ('0172f5aa-52b5-4d6a-acf0-112bb141286c', 'LIT-DQ-002', 'DISPONIBLE', 'BUENO', '1d745bec-a0b2-4674-a9e9-bb4009e1f3c1', 'Ingresó en buen estado general, sin daños visibles reportados.'),
        ('0ff6a327-c727-4634-94f0-db62e021971a', 'LIT-DQ-003', 'DISPONIBLE', 'BUENO', '1d745bec-a0b2-4674-a9e9-bb4009e1f3c1', 'Recibido en condición buena, sin deterioros reportados al ingreso.'),
        ('fd878753-1fc3-44db-8de3-533c916423c7', 'LIT-DQ-004', 'DISPONIBLE', 'BUENO', '1d745bec-a0b2-4674-a9e9-bb4009e1f3c1', 'Al ingreso se registró en buen estado y sin daños aparentes.'),
        ('6965bde1-c1cc-4a14-8225-46c7d843aa7a', 'LIT-DQ-005', 'DISPONIBLE', 'BUENO', '1d745bec-a0b2-4674-a9e9-bb4009e1f3c1', 'Ingresó en buen estado general, sin daños visibles reportados.'),
        ('1941b7c8-6c7a-4686-97b3-16b9d0c4c5bb', 'LIT-DQ-006', 'DISPONIBLE', 'BUENO', '1d745bec-a0b2-4674-a9e9-bb4009e1f3c1', 'Recibido en condición buena, sin deterioros reportados al ingreso.'),
        ('27c3ed9e-4b75-4e31-af4b-dffbf18859f7', 'LIT-DQ-007', 'DISPONIBLE', 'BUENO', '1d745bec-a0b2-4674-a9e9-bb4009e1f3c1', 'Al ingreso se registró en buen estado y sin daños aparentes.'),
        ('279020f8-df8e-4f44-8d32-c46b37643faa', 'LIT-DQ-008', 'DISPONIBLE', 'BUENO', '1d745bec-a0b2-4674-a9e9-bb4009e1f3c1', 'Ingresó en buen estado general, sin daños visibles reportados.'),
        ('bf4fe9dc-42b5-4b7a-b75d-6093bfbb8e50', 'LIT-DQ-009', 'DISPONIBLE', 'BUENO', '1d745bec-a0b2-4674-a9e9-bb4009e1f3c1', 'Recibido en condición buena, sin deterioros reportados al ingreso.'),
        ('95fabcb1-f91a-4720-9535-8bf6c18186ec', 'LIT-DQ-010', 'DISPONIBLE', 'BUENO', '1d745bec-a0b2-4674-a9e9-bb4009e1f3c1', 'Al ingreso se registró en buen estado y sin daños aparentes.'),
        ('ab863557-5782-40f8-88a3-f43192e98f8a', 'LIT-TP-001', 'DISPONIBLE', 'BUENO', 'c679009f-e842-427c-892d-b1694f0325b3', 'Ingresó en buen estado general, sin daños visibles reportados.'),
        ('419cfd51-b7cc-49d0-9e72-c39656c2a269', 'LIT-TP-002', 'DISPONIBLE', 'BUENO', 'c679009f-e842-427c-892d-b1694f0325b3', 'Recibido en condición buena, sin deterioros reportados al ingreso.'),
        ('5e610702-2aae-4204-a83c-fac3f9e9ffcb', 'LIT-TP-003', 'DISPONIBLE', 'BUENO', 'c679009f-e842-427c-892d-b1694f0325b3', 'Al ingreso se registró en buen estado y sin daños aparentes.'),
        ('e702d153-c268-437f-a482-665c0f9dc600', 'LIT-TP-004', 'DISPONIBLE', 'BUENO', 'c679009f-e842-427c-892d-b1694f0325b3', 'Ingresó en buen estado general, sin daños visibles reportados.'),
        ('a7cf2e6a-1bb3-48a9-a816-2f61d05bfc71', 'LIT-TP-005', 'DISPONIBLE', 'BUENO', 'c679009f-e842-427c-892d-b1694f0325b3', 'Recibido en condición buena, sin deterioros reportados al ingreso.'),
        ('12687558-8661-4cf2-ba47-da34026dabd8', 'LIT-TP-006', 'DISPONIBLE', 'BUENO', 'c679009f-e842-427c-892d-b1694f0325b3', 'Al ingreso se registró en buen estado y sin daños aparentes.'),
        ('8560cff4-e270-48fd-8778-6e6f15ffaa1a', 'LIT-TP-007', 'DISPONIBLE', 'BUENO', 'c679009f-e842-427c-892d-b1694f0325b3', 'Ingresó en buen estado general, sin daños visibles reportados.'),
        ('091c6bbe-2f30-421a-af86-231d6fa0da36', 'LIT-TP-008', 'DISPONIBLE', 'BUENO', 'c679009f-e842-427c-892d-b1694f0325b3', 'Recibido en condición buena, sin deterioros reportados al ingreso.'),
        ('93d7e44a-222d-490c-b565-b0df0e0084b4', 'LIT-TP-009', 'DISPONIBLE', 'BUENO', 'c679009f-e842-427c-892d-b1694f0325b3', 'Al ingreso se registró en buen estado y sin daños aparentes.'),
        ('f3458340-afe2-4a00-97a0-f9cdf99601bc', 'LIT-TP-010', 'DISPONIBLE', 'BUENO', 'c679009f-e842-427c-892d-b1694f0325b3', 'Ingresó en buen estado general, sin daños visibles reportados.'),
        ('306207c2-11db-433c-83c3-92768f537d16', 'TEC-LAB-003', 'DISPONIBLE', 'BUENO', '5639214a-7834-4c9d-814b-5404c40a932b', 'Recibido en condición buena, sin deterioros reportados al ingreso.'),
        ('3161966c-3d39-4959-86d6-bacf75453a38', 'TEC-LAB-004', 'DISPONIBLE', 'BUENO', '5639214a-7834-4c9d-814b-5404c40a932b', 'Al ingreso se registró en buen estado y sin daños aparentes.'),
        ('959fa446-e194-4556-9464-f969a134f138', 'TEC-LAB-005', 'DISPONIBLE', 'BUENO', '5639214a-7834-4c9d-814b-5404c40a932b', 'Ingresó en buen estado general, sin daños visibles reportados.'),
        ('f9ed279e-0c46-429d-a327-b040e000f096', 'TEC-LAB-006', 'DISPONIBLE', 'BUENO', '5639214a-7834-4c9d-814b-5404c40a932b', 'Recibido en condición buena, sin deterioros reportados al ingreso.'),
        ('78009382-cc75-42e2-bf89-1ef9f9fbd3c5', 'TEC-LAB-007', 'DISPONIBLE', 'BUENO', '5639214a-7834-4c9d-814b-5404c40a932b', 'Al ingreso se registró en buen estado y sin daños aparentes.'),
        ('92c7743e-c450-4f46-aa9e-fda533a05d94', 'TEC-LAB-008', 'DISPONIBLE', 'BUENO', '5639214a-7834-4c9d-814b-5404c40a932b', 'Ingresó en buen estado general, sin daños visibles reportados.'),
        ('48e70b56-3157-409b-af96-fd874858c9c8', 'TEC-LAB-009', 'DISPONIBLE', 'BUENO', '5639214a-7834-4c9d-814b-5404c40a932b', 'Recibido en condición buena, sin deterioros reportados al ingreso.'),
        ('fdd3bc59-051d-4255-a36b-14f8b242aa40', 'TEC-LAB-010', 'DISPONIBLE', 'BUENO', '5639214a-7834-4c9d-814b-5404c40a932b', 'Al ingreso se registró en buen estado y sin daños aparentes.'),
        ('9c28b188-ba6c-4e10-ab66-00de594f74cb', 'TEC-ROB-002', 'DISPONIBLE', 'BUENO', 'c32ad0c8-7c23-4529-9133-a7817277ea7f', 'Recibido en condición buena, sin deterioros reportados al ingreso.'),
        ('53bd2ee3-2cb6-45c3-a3e0-b5459d06e595', 'TEC-ROB-003', 'DISPONIBLE', 'BUENO', 'c32ad0c8-7c23-4529-9133-a7817277ea7f', 'Al ingreso se registró en buen estado y sin daños aparentes.'),
        ('16482725-961c-45c8-bf2e-85f298b98483', 'TEC-ROB-004', 'DISPONIBLE', 'BUENO', 'c32ad0c8-7c23-4529-9133-a7817277ea7f', 'Ingresó en buen estado general, sin daños visibles reportados.'),
        ('0e4969cc-ebde-490d-a6bc-eb01c1785a29', 'TEC-ROB-005', 'DISPONIBLE', 'BUENO', 'c32ad0c8-7c23-4529-9133-a7817277ea7f', 'Recibido en condición buena, sin deterioros reportados al ingreso.'),
        ('79fd47c8-5157-4d10-9ff6-50273bac24e2', 'TEC-ROB-006', 'DISPONIBLE', 'BUENO', 'c32ad0c8-7c23-4529-9133-a7817277ea7f', 'Al ingreso se registró en buen estado y sin daños aparentes.'),
        ('bb9efe46-fa46-4353-881e-e53eb5bb915b', 'TEC-ROB-007', 'DISPONIBLE', 'BUENO', 'c32ad0c8-7c23-4529-9133-a7817277ea7f', 'Ingresó en buen estado general, sin daños visibles reportados.'),
        ('e943b71e-9832-4904-939f-46c89c96b28f', 'TEC-ROB-008', 'DISPONIBLE', 'BUENO', 'c32ad0c8-7c23-4529-9133-a7817277ea7f', 'Recibido en condición buena, sin deterioros reportados al ingreso.'),
        ('ba0d7265-71d6-4dbe-a8af-fbb88413801f', 'TEC-ROB-009', 'DISPONIBLE', 'BUENO', 'c32ad0c8-7c23-4529-9133-a7817277ea7f', 'Al ingreso se registró en buen estado y sin daños aparentes.'),
        ('0edef5ab-f20e-4be1-91d0-7f63519e872f', 'TEC-ROB-010', 'DISPONIBLE', 'BUENO', 'c32ad0c8-7c23-4529-9133-a7817277ea7f', 'Ingresó en buen estado general, sin daños visibles reportados.'),
        ('46ad431c-a997-4e3c-ad99-547ea10d21e0', 'CIE-MIC-001', 'DISPONIBLE', 'BUENO', 'ae6a7d0b-ce25-40f6-becf-e6d4c18d3f64', 'Recibido en condición buena, sin deterioros reportados al ingreso.'),
        ('57afbfd4-54a4-4c66-a888-9ada6cc0bd3c', 'CIE-MIC-002', 'DISPONIBLE', 'BUENO', 'ae6a7d0b-ce25-40f6-becf-e6d4c18d3f64', 'Al ingreso se registró en buen estado y sin daños aparentes.'),
        ('7a43e56b-2689-4b00-aafb-e1acd9b141df', 'CIE-MIC-003', 'DISPONIBLE', 'BUENO', 'ae6a7d0b-ce25-40f6-becf-e6d4c18d3f64', 'Ingresó en buen estado general, sin daños visibles reportados.'),
        ('0972384e-d226-4eb2-91b0-cf9d63c96c41', 'CIE-MIC-004', 'DISPONIBLE', 'BUENO', 'ae6a7d0b-ce25-40f6-becf-e6d4c18d3f64', 'Recibido en condición buena, sin deterioros reportados al ingreso.'),
        ('131a4904-044b-468b-8981-80816734f928', 'CIE-MIC-005', 'DISPONIBLE', 'BUENO', 'ae6a7d0b-ce25-40f6-becf-e6d4c18d3f64', 'Al ingreso se registró en buen estado y sin daños aparentes.'),
        ('4fe51bc9-fcd5-4195-a7ed-d95cba2cb4d7', 'CIE-MIC-006', 'DISPONIBLE', 'BUENO', 'ae6a7d0b-ce25-40f6-becf-e6d4c18d3f64', 'Ingresó en buen estado general, sin daños visibles reportados.'),
        ('7de93987-b876-4c69-8aed-4a80ddec646a', 'CIE-MIC-007', 'DISPONIBLE', 'BUENO', 'ae6a7d0b-ce25-40f6-becf-e6d4c18d3f64', 'Recibido en condición buena, sin deterioros reportados al ingreso.'),
        ('af393b91-d38c-43b0-9b8b-17b32957bf06', 'CIE-MIC-008', 'DISPONIBLE', 'BUENO', 'ae6a7d0b-ce25-40f6-becf-e6d4c18d3f64', 'Al ingreso se registró en buen estado y sin daños aparentes.'),
        ('4317821c-eba8-446c-b41f-60f7d7afca5a', 'CIE-MIC-009', 'DISPONIBLE', 'BUENO', 'ae6a7d0b-ce25-40f6-becf-e6d4c18d3f64', 'Ingresó en buen estado general, sin daños visibles reportados.'),
        ('9fd9e265-c889-42bb-9f1c-f17a08b17a07', 'CIE-MIC-010', 'DISPONIBLE', 'BUENO', 'ae6a7d0b-ce25-40f6-becf-e6d4c18d3f64', 'Recibido en condición buena, sin deterioros reportados al ingreso.'),
        ('c14d7972-2a97-49ac-99ff-0fd210e1aae3', 'MAT-CAL-003', 'DISPONIBLE', 'BUENO', 'd8988724-eaa5-4d5b-84ab-778314ceeab3', 'Ingresó en buen estado general, sin daños visibles reportados.'),
        ('2ba5e115-dd08-411f-86da-9bb0bcb1487d', 'MAT-CAL-004', 'DISPONIBLE', 'BUENO', 'd8988724-eaa5-4d5b-84ab-778314ceeab3', 'Recibido en condición buena, sin deterioros reportados al ingreso.'),
        ('40daf96e-65f2-4721-a225-2bc9f449884a', 'MAT-CAL-005', 'DISPONIBLE', 'BUENO', 'd8988724-eaa5-4d5b-84ab-778314ceeab3', 'Al ingreso se registró en buen estado y sin daños aparentes.'),
        ('b01b6b4d-6cd9-4319-8c82-9c272a9e8b25', 'MAT-CAL-006', 'DISPONIBLE', 'BUENO', 'd8988724-eaa5-4d5b-84ab-778314ceeab3', 'Ingresó en buen estado general, sin daños visibles reportados.'),
        ('ede92d0e-3605-460f-a886-fcb0ce1a1361', 'MAT-CAL-007', 'DISPONIBLE', 'BUENO', 'd8988724-eaa5-4d5b-84ab-778314ceeab3', 'Recibido en condición buena, sin deterioros reportados al ingreso.'),
        ('80e2c15c-4a4c-4679-b63b-2f47a62d6ca6', 'MAT-CAL-008', 'DISPONIBLE', 'BUENO', 'd8988724-eaa5-4d5b-84ab-778314ceeab3', 'Al ingreso se registró en buen estado y sin daños aparentes.'),
        ('33356303-d3c9-4cb2-a281-3ce2deefbba9', 'MAT-CAL-009', 'DISPONIBLE', 'BUENO', 'd8988724-eaa5-4d5b-84ab-778314ceeab3', 'Ingresó en buen estado general, sin daños visibles reportados.'),
        ('0555c0e6-f827-44c5-a327-8de439539f2d', 'MAT-CAL-010', 'DISPONIBLE', 'BUENO', 'd8988724-eaa5-4d5b-84ab-778314ceeab3', 'Recibido en condición buena, sin deterioros reportados al ingreso.'),
        ('9cefc670-7c4f-493c-b7ea-5a76548b8cd0', 'MAT-CAL-002', 'DISPONIBLE', 'BUENO', 'd8988724-eaa5-4d5b-84ab-778314ceeab3', 'Al ingreso se registró en buen estado y sin daños aparentes.'),
        ('5114855c-0ffe-416c-87b4-a6aaa0945bc1', 'TEC-ROB-001', 'DISPONIBLE', 'BUENO', 'c32ad0c8-7c23-4529-9133-a7817277ea7f', 'Ingresó en buen estado general, sin daños visibles reportados.'),
        ('6c60472a-815c-4dfe-8b6a-1c028640804e', 'LIT-DQ-001', 'PRESTADO', 'BUENO', '1d745bec-a0b2-4674-a9e9-bb4009e1f3c1', 'Al ingreso se registró en buen estado y sin daños aparentes.'),
        ('8b29c5cf-f08f-43f6-9ced-d049a25efeb7', 'TEC-LAB-002', 'EN_MANTENIMIENTO', 'DANADO', '5639214a-7834-4c9d-814b-5404c40a932b', 'Ingresó en buen estado general, sin daños visibles reportados.'),
        ('7293ab36-043e-44ff-9e39-2a5046928d38', 'TEC-ROB-011', 'DISPONIBLE', 'BUENO', 'c32ad0c8-7c23-4529-9133-a7817277ea7f', 'Ingresó en buen estado general, sin daños visibles reportados.'),
        ('697fbeb3-c71e-4281-86e7-075dff8f0bde', 'TEC-OCU-001', 'DISPONIBLE', 'BUENO', '16f2c87e-9c92-4f53-96ae-138792accccb', 'Recibido en condición buena, sin deterioros reportados al ingreso.'),
        ('ed42b22b-0f9d-466a-a2be-e43cf271cda6', 'TEC-PRY-001', 'DISPONIBLE', 'BUENO', '51cad05b-8c49-4dfa-8309-ffc224bb2a44', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('c68931a9-19a4-4ff7-aa3e-de0e7e2d4cc0', 'TEC-PRY-002', 'DISPONIBLE', 'BUENO', '51cad05b-8c49-4dfa-8309-ffc224bb2a44', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('db7eecb7-8397-4791-b7d9-df45ace4aff0', 'TEC-PRY-003', 'DISPONIBLE', 'BUENO', '51cad05b-8c49-4dfa-8309-ffc224bb2a44', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('9ca2c57c-befc-4fcb-be0e-e5777d0ad2c7', 'TEC-CAM-001', 'DISPONIBLE', 'BUENO', 'f2f91f4b-de82-4cc9-95b2-b113f61e0668', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('e9cc1320-b939-4f0e-8662-3610c7e557b3', 'TEC-CAM-002', 'DISPONIBLE', 'BUENO', 'f2f91f4b-de82-4cc9-95b2-b113f61e0668', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('20a5d89e-e1d4-4687-b7af-46560013fbf6', 'TEC-CAM-003', 'DISPONIBLE', 'BUENO', 'f2f91f4b-de82-4cc9-95b2-b113f61e0668', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('2257abf8-a7aa-419d-85f3-71bae156bf58', 'COM-TAB-001', 'DISPONIBLE', 'BUENO', '346e47f7-a715-4a64-a0e0-c352fe5476ba', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('ce05869b-607b-4be6-a05c-b95b61a7b8f5', 'COM-TAB-002', 'DISPONIBLE', 'BUENO', '346e47f7-a715-4a64-a0e0-c352fe5476ba', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('ebcd1803-0db3-4726-b3ad-09a8c8ecfcb3', 'COM-TAB-003', 'DISPONIBLE', 'BUENO', '346e47f7-a715-4a64-a0e0-c352fe5476ba', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('3195fd4d-04b0-4be5-ab34-42a06d10b1ce', 'COM-LEN-002', 'DISPONIBLE', 'BUENO', '82a631fe-0985-467b-9064-31da6466db84', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('ec06f059-882b-45e0-92d8-84b856c607d0', 'COM-LEN-003', 'DISPONIBLE', 'BUENO', '82a631fe-0985-467b-9064-31da6466db84', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('d67dbfe8-7b8b-4f19-93a8-b3c57bc083f1', 'LAB-BAL-001', 'DISPONIBLE', 'BUENO', '831f38ab-fd18-4dd1-9302-d34c3e0ac289', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('b5a1718c-0df7-4917-8ccf-a6b43a9b4cf3', 'LAB-BAL-002', 'DISPONIBLE', 'BUENO', '831f38ab-fd18-4dd1-9302-d34c3e0ac289', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('440e1aeb-0eec-4ee0-b6dc-8b53857d8cd8', 'LAB-BAL-003', 'DISPONIBLE', 'BUENO', '831f38ab-fd18-4dd1-9302-d34c3e0ac289', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('0cf39221-522a-4b78-8487-926c4ab4be2b', 'LAB-QUI-001', 'DISPONIBLE', 'BUENO', 'bafc250a-bdc7-476e-8653-bb9082cfe1d6', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('90c8b46d-6f3d-4460-bcc5-83af267f6f8d', 'LAB-QUI-002', 'DISPONIBLE', 'BUENO', 'bafc250a-bdc7-476e-8653-bb9082cfe1d6', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('50555cd6-0356-46ed-ae60-3d583a91ab7c', 'LAB-QUI-003', 'DISPONIBLE', 'BUENO', 'bafc250a-bdc7-476e-8653-bb9082cfe1d6', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('b83b4866-3bac-4b1f-9ca1-d1373ab13acc', 'LIT-CAS-001', 'DISPONIBLE', 'BUENO', '9747fcb3-298f-4137-91ee-67300328a31b', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('dad0936a-795e-4d24-b90b-c410b74f0bf0', 'LIT-CAS-002', 'DISPONIBLE', 'BUENO', '9747fcb3-298f-4137-91ee-67300328a31b', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('5cf66d1e-6516-482c-9b7a-17a6f315a129', 'LIT-CAS-003', 'DISPONIBLE', 'BUENO', '9747fcb3-298f-4137-91ee-67300328a31b', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('a3948e7d-7b76-4d2f-8bc5-a4dc13a8672a', 'LIT-CYP-001', 'DISPONIBLE', 'BUENO', '4696b813-f219-466e-8cd2-55670b0537af', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('3b746721-cb5a-473a-b922-90d1357577d4', 'LIT-CYP-002', 'DISPONIBLE', 'BUENO', '4696b813-f219-466e-8cd2-55670b0537af', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('c718c59c-3248-43cc-9201-2933cbd863b5', 'LIT-CYP-003', 'DISPONIBLE', 'BUENO', '4696b813-f219-466e-8cd2-55670b0537af', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('c923d8db-619f-411a-89b1-09fa188573ba', 'EDU-ATL-001', 'DISPONIBLE', 'BUENO', '23e794bd-06bc-46be-a371-c4d8c51f4036', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('0820c19b-9a17-4ede-8164-83016dcf62a8', 'EDU-ATL-002', 'DISPONIBLE', 'BUENO', '23e794bd-06bc-46be-a371-c4d8c51f4036', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('c6ce2a43-8598-4d70-98f0-acff7c21ea0a', 'EDU-ATL-003', 'DISPONIBLE', 'BUENO', '23e794bd-06bc-46be-a371-c4d8c51f4036', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('3e5e2080-bf92-40c0-8f3e-a5f23c423f92', 'ROB-IMP-001', 'DISPONIBLE', 'BUENO', 'ed0a406d-fb71-4606-a3c5-7eabc4704a2c', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('fbf23f73-e6df-4708-9665-66cbf7f80af5', 'ROB-IMP-002', 'DISPONIBLE', 'BUENO', 'ed0a406d-fb71-4606-a3c5-7eabc4704a2c', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('b82e22cf-c1c3-4cec-b661-0d6f6eb4ebe6', 'ROB-IMP-003', 'DISPONIBLE', 'BUENO', 'ed0a406d-fb71-4606-a3c5-7eabc4704a2c', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('6dcc8513-6763-4ceb-a04b-1f21d69bc1bd', 'MAT-CAL-001', 'PRESTADO', 'BUENO', 'd8988724-eaa5-4d5b-84ab-778314ceeab3', 'Recibido en condición buena, sin deterioros reportados al ingreso.'),
        ('e23f39d5-6f94-4e1a-b364-4ab881ea4e22', 'COM-LEN-001', 'RESERVADO', 'BUENO', '82a631fe-0985-467b-9064-31da6466db84', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('6bd46d0c-015c-4512-81df-653f8a93f8b5', 'DEP-BAL-001', 'DISPONIBLE', 'BUENO', 'dfb32c48-8d68-4631-a14d-024690e03148', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('2d763b68-8365-4502-b781-3ebde99d927c', 'DEP-BAL-002', 'DISPONIBLE', 'BUENO', 'dfb32c48-8d68-4631-a14d-024690e03148', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('c7814a52-7163-48af-bad5-016ff1791768', 'DEP-BAL-003', 'DISPONIBLE', 'BUENO', 'dfb32c48-8d68-4631-a14d-024690e03148', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('eb0a8a82-c3bb-4e8a-95b5-361503e73963', 'DEP-AJE-001', 'DISPONIBLE', 'BUENO', '769278d1-b5f9-413f-aa9f-c1b52fdd8968', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('f84128cf-ebea-43c9-b59b-36bb3f302bfe', 'DEP-AJE-002', 'DISPONIBLE', 'BUENO', '769278d1-b5f9-413f-aa9f-c1b52fdd8968', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('390b424b-7d32-46b8-a56d-d5794250eca1', 'DEP-AJE-003', 'DISPONIBLE', 'BUENO', '769278d1-b5f9-413f-aa9f-c1b52fdd8968', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('1b27ff8c-d3e9-483d-80a3-2b4f6e081219', 'DEMO-LIB-002', 'DISPONIBLE', 'BUENO', 'fd94100b-bf80-4980-a878-6efe4a8f94ae', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('12556f20-5de5-40d3-a1f1-90d56f09dcf2', 'DEMO-KIT-002', 'DISPONIBLE', 'BUENO', '6bec9443-b0f8-47c1-a97c-b96b35e3968f', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('70248dc5-04b2-4621-bd67-f388cfdfec29', 'DEMO-LIB-001', 'PRESTADO', 'BUENO', 'fd94100b-bf80-4980-a878-6efe4a8f94ae', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('1ffaf6cf-9378-4dc4-985b-cdc5c04a25cc', 'DEMO-KIT-003', 'PRESTADO', 'BUENO', '6bec9443-b0f8-47c1-a97c-b96b35e3968f', 'Ingreso en buen estado general, sin danos visibles reportados.'),
        ('9221b731-93b4-4918-aeb9-86a4e94d6bd5', 'COM-HP-001', 'DISPONIBLE', 'REGULAR', '0b6d4c8a-adc0-4aa9-949a-d76d2781b521', 'Ingreso con desgaste leve por uso, funcional.'),
        ('88b45169-f654-4c3a-a7d0-427a047a3a1e', 'COM-HP-002', 'PRESTADO', 'REGULAR', '0b6d4c8a-adc0-4aa9-949a-d76d2781b521', 'Ingreso con desgaste leve por uso, funcional.'),
        ('57f8bdb9-a885-4190-825f-8882d7cbdeb7', 'DEMO-KIT-001', 'DISPONIBLE', 'BUENO', '6bec9443-b0f8-47c1-a97c-b96b35e3968f', 'Ingreso en buen estado general, sin danos visibles reportados.');
    INSERT INTO public.prestamos (id, fecha_prestamo, fecha_limite, fecha_devolucion, estado, usuario_id, ejemplar_fisico_id, registrado_por_id, renovaciones, fecha_entrega, condicion_devolucion, observaciones, condicion_entrega) VALUES
        ('d5160eae-2172-4ba6-8f39-19665b25908d', '2026-10-27 23:12:20.524699-05', NULL, NULL, 'CANCELADO', '3', '697fbeb3-c71e-4281-86e7-075dff8f0bde', NULL, '0', NULL, NULL, '', NULL),
        ('e5139bf4-2bbe-4f31-a174-cd646cf44c1f', '2026-10-27 23:23:51.846373-05', NULL, NULL, 'CANCELADO', '2', '697fbeb3-c71e-4281-86e7-075dff8f0bde', NULL, '0', NULL, NULL, '', NULL),
        ('06973191-e254-44de-83f4-e1e98d3b9c91', '2026-10-27 23:24:56.937297-05', NULL, NULL, 'CANCELADO', '2', '454fae03-3e05-4e1c-9e58-e1876fa60bd6', NULL, '0', NULL, NULL, '', NULL),
        ('ed0ce586-b8cd-418a-bfdd-82271d3d057f', '2026-10-27 23:14:28.650163-05', NULL, NULL, 'CANCELADO', '3', '6dcc8513-6763-4ceb-a04b-1f21d69bc1bd', NULL, '0', NULL, NULL, '', NULL),
        ('d1654fdd-c21d-49f6-8c69-402b9c325497', '2026-10-27 23:15:40.148995-05', NULL, NULL, 'CANCELADO', '3', '5114855c-0ffe-416c-87b4-a6aaa0945bc1', NULL, '0', NULL, NULL, '', NULL),
        ('7758eb8d-1993-4daf-8d2f-62e658f1b8a5', '2026-10-27 23:14:19.878708-05', NULL, NULL, 'CANCELADO', '3', '6c60472a-815c-4dfe-8b6a-1c028640804e', NULL, '0', NULL, NULL, '', NULL),
        ('cf31a937-93e9-4df7-91af-6efe7b355b48', '2026-11-04 06:04:51.421762-05', NULL, NULL, 'CANCELADO', '6', '6dcc8513-6763-4ceb-a04b-1f21d69bc1bd', NULL, '0', NULL, NULL, '', NULL),
        ('fceb92b9-6ceb-47c6-b82d-f398c34372c2', '2026-11-16 22:06:44.238678-05', NULL, NULL, 'CANCELADO', '9', '12556f20-5de5-40d3-a1f1-90d56f09dcf2', NULL, '0', NULL, NULL, '', NULL),
        ('5b0d6c1e-3f2a-4c7e-9a41-7d8e2f6b0c11', '2026-11-17 09:25:00-05', '2026-11-23', NULL, 'ACTIVO', '3', '88b45169-f654-4c3a-a7d0-427a047a3a1e', '2', '0', '2026-11-17 09:30:00-05', NULL, '', 'REGULAR'),
        ('b17f7257-ed8c-4134-a6bf-0136fc9f7f44', '2026-11-16 22:06:44.238078-05', NULL, NULL, 'CANCELADO', '8', '57f8bdb9-a885-4190-825f-8882d7cbdeb7', NULL, '0', NULL, NULL, '', NULL),
        ('658855a1-63d7-4d67-8d1c-4e57d5e35d14', '2026-10-27 23:30:40.750281-05', '2026-11-07', '2026-11-18', 'DEVUELTO', '4', '454fae03-3e05-4e1c-9e58-e1876fa60bd6', '2', '0', '2026-10-27 23:30:40.748469-05', 'REGULAR', 'El item se devuelvio en el mismo estado en el q vino', 'BUENO'),
        ('49c12007-87d2-4a21-b49f-70b958212ce4', '2026-11-04 01:11:03.334231-05', '2026-11-06', '2026-11-04', 'DEVUELTO', '2', '8b29c5cf-f08f-43f6-9ced-d049a25efeb7', '2', '0', '2026-11-04 01:11:03.332016-05', 'DANADO', '', 'BUENO'),
        ('56b716f0-85cc-4d56-8749-45ceaf102ea7', '2026-11-16 22:06:44.234657-05', '2026-11-23', NULL, 'ACTIVO', '8', '70248dc5-04b2-4621-bd67-f388cfdfec29', '2', '0', '2026-11-16 22:06:44.228299-05', NULL, '', 'BUENO'),
        ('d412fc3f-361c-4e66-8e80-0363f83b996f', '2026-11-03 22:04:22.105785-05', '2026-11-05', NULL, 'VENCIDO', '2', '6c60472a-815c-4dfe-8b6a-1c028640804e', '2', '0', '2026-11-03 22:04:22.103454-05', NULL, '', 'BUENO'),
        ('a86bc010-b370-43d8-b7ad-ce30af14354d', '2026-10-27 23:24:51.550462-05', '2026-10-29', '2026-10-27', 'DEVUELTO', '2', '697fbeb3-c71e-4281-86e7-075dff8f0bde', '2', '0', '2026-10-27 23:27:17.015425-05', 'BUENO', '', 'BUENO'),
        ('e4770ddd-18ae-44ac-a49b-88389712734a', '2026-10-27 23:24:09.858225-05', '2026-10-29', '2026-10-27', 'DEVUELTO', '2', '9cefc670-7c4f-493c-b7ea-5a76548b8cd0', '2', '0', '2026-10-27 23:27:38.853724-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000003', '2024-01-10 14:52:00-05', '2024-01-21', '2024-01-18', 'DEVUELTO', '1', '2d763b68-8365-4502-b781-3ebde99d927c', '2', '0', '2024-01-10 14:57:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000024', '2024-05-01 11:17:00-05', '2024-05-12', '2024-05-11', 'DEVUELTO', '1', '92c7743e-c450-4f46-aa9e-fda533a05d94', '2', '0', '2024-05-01 11:22:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000031', '2024-05-24 11:44:00-05', NULL, NULL, 'CANCELADO', '1', 'dad0936a-795e-4d24-b90b-c410b74f0bf0', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000045', '2024-07-19 13:15:00-05', '2024-07-30', '2024-08-03', 'DEVUELTO', '1', '0ff6a327-c727-4634-94f0-db62e021971a', '2', '0', '2024-07-19 13:20:00-05', 'REGULAR', 'Devuelto con 4 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000066', '2024-10-10 15:33:00-05', '2024-10-21', '2024-10-19', 'DEVUELTO', '1', '7a43e56b-2689-4b00-aafb-e1acd9b141df', '2', '0', '2024-10-10 15:38:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000087', '2024-12-19 16:09:00-05', '2024-12-30', '2024-12-29', 'DEVUELTO', '1', 'c14d7972-2a97-49ac-99ff-0fd210e1aae3', '2', '0', '2024-12-19 16:14:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000108', '2025-03-19 11:32:00-05', '2025-03-30', '2025-03-31', 'DEVUELTO', '1', '6bd46d0c-015c-4512-81df-653f8a93f8b5', '2', '0', '2025-03-19 11:37:00-05', 'BUENO', 'Devuelto con 1 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000129', '2025-05-22 10:51:00-05', '2025-06-02', '2025-05-31', 'DEVUELTO', '1', '78009382-cc75-42e2-bf89-1ef9f9fbd3c5', '2', '0', '2025-05-22 10:56:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000150', '2025-08-08 12:26:00-05', NULL, NULL, 'CANCELADO', '1', '0172f5aa-52b5-4d6a-acf0-112bb141286c', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000171', '2025-11-17 14:18:00-05', NULL, NULL, 'CANCELADO', '1', '57afbfd4-54a4-4c66-a888-9ada6cc0bd3c', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000192', '2026-01-25 13:11:00-05', '2026-02-05', '2026-02-02', 'DEVUELTO', '1', 'f3458340-afe2-4a00-97a0-f9cdf99601bc', '2', '0', '2026-01-25 13:16:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000213', '2026-05-07 16:52:00-05', '2026-05-18', '2026-05-15', 'DEVUELTO', '1', '390b424b-7d32-46b8-a56d-d5794250eca1', '2', '0', '2026-05-07 16:57:00-05', 'REGULAR', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000234', '2026-08-04 15:11:00-05', '2026-08-15', '2026-08-14', 'DEVUELTO', '1', 'f9ed279e-0c46-429d-a327-b040e000f096', '2', '0', '2026-08-04 15:16:00-05', 'BUENO', '', 'BUENO'),
        ('9d05bcbd-a0ae-4c0f-8606-4786d22719a0', '2026-11-16 22:06:44.237649-05', '2026-11-23', '2026-11-16', 'DEVUELTO', '9', '1b27ff8c-d3e9-483d-80a3-2b4f6e081219', '2', '0', '2026-11-16 22:06:44.228299-05', 'BUENO', '', 'BUENO'),
        ('78c69976-6a06-4e90-a59b-56bb1824673a', '2026-11-08 22:06:44.228299-05', '2026-11-15', NULL, 'VENCIDO', '9', '1ffaf6cf-9378-4dc4-985b-cdc5c04a25cc', '2', '0', '2026-11-08 22:06:44.228299-05', NULL, '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000010', '2024-02-11 13:04:00-05', '2024-02-22', '2024-02-19', 'DEVUELTO', '1', '20a5d89e-e1d4-4687-b7af-46560013fbf6', '2', '0', '2024-02-11 13:09:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000017', '2024-03-11 12:43:00-05', '2024-03-22', '2024-03-20', 'DEVUELTO', '1', 'b5a1718c-0df7-4917-8ccf-a6b43a9b4cf3', '2', '0', '2024-03-11 12:48:00-05', 'REGULAR', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000038', '2024-07-01 15:17:00-05', '2024-07-12', '2024-07-11', 'DEVUELTO', '1', '9c28b188-ba6c-4e10-ab66-00de594f74cb', '2', '0', '2024-07-01 15:22:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000059', '2024-09-14 10:14:00-05', '2024-09-25', '2024-09-22', 'DEVUELTO', '1', 'bf4fe9dc-42b5-4b7a-b75d-6093bfbb8e50', '2', '0', '2024-09-14 10:19:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000007', '2024-02-01 15:41:00-05', NULL, NULL, 'CANCELADO', '3', '5e610702-2aae-4204-a83c-fac3f9e9ffcb', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000021', '2024-04-07 10:44:00-05', '2024-04-13', '2024-04-13', 'DEVUELTO', '3', '93d7e44a-222d-490c-b565-b0df0e0084b4', '2', '0', '2024-04-07 10:49:00-05', 'REGULAR', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000035', '2024-06-14 13:38:00-05', NULL, NULL, 'CANCELADO', '3', 'ede92d0e-3605-460f-a886-fcb0ce1a1361', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000042', '2024-07-11 13:31:00-05', '2024-07-17', '2024-07-14', 'DEVUELTO', '3', 'f84128cf-ebea-43c9-b59b-36bb3f302bfe', '2', '0', '2024-07-11 13:36:00-05', 'REGULAR', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000063', '2024-10-01 14:51:00-05', '2024-10-07', '2024-10-10', 'DEVUELTO', '3', '959fa446-e194-4556-9464-f969a134f138', '2', '0', '2024-10-01 14:56:00-05', 'BUENO', 'Devuelto con 3 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000084', '2024-12-11 16:23:00-05', '2024-12-17', '2024-12-16', 'DEVUELTO', '3', '3b746721-cb5a-473a-b922-90d1357577d4', '2', '0', '2024-12-11 16:28:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000105', '2025-03-11 11:51:00-05', '2025-03-17', '2025-03-15', 'DEVUELTO', '3', '7293ab36-043e-44ff-9e39-2a5046928d38', '2', '0', '2025-03-11 11:56:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000126', '2025-05-14 10:17:00-05', '2025-05-20', '2025-05-19', 'DEVUELTO', '3', '091c6bbe-2f30-421a-af86-231d6fa0da36', '2', '0', '2025-05-14 10:22:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000147', '2025-07-25 16:16:00-05', NULL, NULL, 'CANCELADO', '3', 'eb0a8a82-c3bb-4e8a-95b5-361503e73963', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000168', '2025-11-09 10:55:00-05', '2025-11-15', '2025-11-14', 'DEVUELTO', '3', '3161966c-3d39-4959-86d6-bacf75453a38', '2', '0', '2025-11-09 11:00:00-05', 'REGULAR', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000189', '2026-01-16 13:18:00-05', '2026-01-22', '2026-01-19', 'DEVUELTO', '3', 'a3948e7d-7b76-4d2f-8bc5-a4dc13a8672a', '2', '0', '2026-01-16 13:23:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000210', '2026-04-23 08:32:00-05', '2026-04-29', '2026-04-29', 'DEVUELTO', '3', '0edef5ab-f20e-4be1-91d0-7f63519e872f', '2', '0', '2026-04-23 08:37:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000231', '2026-07-21 12:14:00-05', '2026-07-27', '2026-07-25', 'DEVUELTO', '3', '8560cff4-e270-48fd-8778-6e6f15ffaa1a', '2', '0', '2026-07-21 12:19:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000018', '2024-03-17 13:57:00-05', '2024-03-28', '2024-04-02', 'DEVUELTO', '4', '5cf66d1e-6516-482c-9b7a-17a6f315a129', '2', '0', '2024-03-17 14:02:00-05', 'BUENO', 'Devuelto con 5 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000039', '2024-07-03 12:20:00-05', '2024-07-14', '2024-07-12', 'DEVUELTO', '4', 'ba0d7265-71d6-4dbe-a8af-fbb88413801f', '2', '0', '2024-07-03 12:25:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000060', '2024-09-17 16:51:00-05', '2024-09-28', '2024-09-25', 'DEVUELTO', '4', '12687558-8661-4cf2-ba47-da34026dabd8', '2', '0', '2024-09-17 16:56:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000081', '2024-12-03 15:34:00-05', '2024-12-14', '2024-12-11', 'DEVUELTO', '4', 'ce05869b-607b-4be6-a05c-b95b61a7b8f5', '2', '0', '2024-12-03 15:39:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000095', '2025-02-01 14:17:00-05', NULL, NULL, 'CANCELADO', '4', '2d763b68-8365-4502-b781-3ebde99d927c', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000102', '2025-03-03 11:19:00-05', NULL, NULL, 'CANCELADO', '4', '20a5d89e-e1d4-4687-b7af-46560013fbf6', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000123', '2025-05-06 16:38:00-05', NULL, NULL, 'CANCELADO', '4', 'dad0936a-795e-4d24-b90b-c410b74f0bf0', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000144', '2025-07-16 12:01:00-05', '2025-07-27', '2025-07-25', 'DEVUELTO', '4', 'e943b71e-9832-4904-939f-46c89c96b28f', '2', '0', '2025-07-16 12:06:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000158', '2025-09-17 11:44:00-05', NULL, NULL, 'CANCELADO', '4', '7a43e56b-2689-4b00-aafb-e1acd9b141df', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000165', '2025-11-01 10:02:00-05', '2025-11-12', '2025-11-11', 'DEVUELTO', '4', 'a7cf2e6a-1bb3-48a9-a816-2f61d05bfc71', '2', '0', '2025-11-01 10:07:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000186', '2026-01-07 08:24:00-05', NULL, NULL, 'CANCELADO', '4', '2257abf8-a7aa-419d-85f3-71bae156bf58', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000207', '2026-04-10 13:13:00-05', '2026-04-21', '2026-04-24', 'DEVUELTO', '4', 'e9cc1320-b939-4f0e-8662-3610c7e557b3', '2', '0', '2026-04-10 13:18:00-05', 'BUENO', 'Devuelto con 3 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000228', '2026-07-11 10:51:00-05', '2026-07-22', '2026-07-21', 'DEVUELTO', '4', 'b83b4866-3bac-4b1f-9ca1-d1373ab13acc', '2', '0', '2026-07-11 10:56:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000005', '2024-01-19 14:41:00-05', NULL, NULL, 'CANCELADO', '5', 'a3948e7d-7b76-4d2f-8bc5-a4dc13a8672a', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000012', '2024-02-17 09:34:00-05', '2024-02-28', '2024-02-29', 'DEVUELTO', '5', '16482725-961c-45c8-bf2e-85f298b98483', '2', '0', '2024-02-17 09:39:00-05', 'BUENO', 'Devuelto con 1 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000033', '2024-06-05 08:28:00-05', '2024-06-16', '2024-06-16', 'DEVUELTO', '5', 'ab863557-5782-40f8-88a3-f43192e98f8a', '2', '0', '2024-06-05 08:33:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000054', '2024-08-24 13:46:00-05', NULL, NULL, 'CANCELADO', '5', '9221b731-93b4-4918-aeb9-86a4e94d6bd5', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000075', '2024-11-11 08:40:00-05', '2024-11-22', '2024-11-21', 'DEVUELTO', '5', '3e5e2080-bf92-40c0-8f3e-a5f23c423f92', '2', '0', '2024-11-11 08:45:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000096', '2025-02-05 12:13:00-05', NULL, NULL, 'CANCELADO', '5', '440e1aeb-0eec-4ee0-b6dc-8b53857d8cd8', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000117', '2025-04-17 14:36:00-05', '2025-04-28', '2025-04-28', 'DEVUELTO', '5', '53bd2ee3-2cb6-45c3-a3e0-b5459d06e595', '2', '0', '2025-04-17 14:41:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000124', '2025-05-09 09:23:00-05', NULL, NULL, 'CANCELADO', '5', 'fd878753-1fc3-44db-8de3-533c916423c7', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000138', '2025-06-24 11:25:00-05', '2025-07-05', '2025-07-04', 'DEVUELTO', '5', '95fabcb1-f91a-4720-9535-8bf6c18186ec', '2', '0', '2025-06-24 11:30:00-05', 'REGULAR', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000159', '2025-09-22 15:46:00-05', '2025-10-03', '2025-10-03', 'DEVUELTO', '5', '9fd9e265-c889-42bb-9f1c-f17a08b17a07', '2', '0', '2025-09-22 15:51:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000180', '2025-12-16 10:50:00-05', '2025-12-27', '2025-12-27', 'DEVUELTO', '5', '0555c0e6-f827-44c5-a327-8de439539f2d', '2', '0', '2025-12-16 10:55:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000201', '2026-03-10 11:58:00-05', '2026-03-21', '2026-03-24', 'DEVUELTO', '5', 'b5a1718c-0df7-4917-8ccf-a6b43a9b4cf3', '2', '0', '2026-03-10 12:03:00-05', 'BUENO', 'Devuelto con 3 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000222', '2026-06-11 12:39:00-05', '2026-06-22', '2026-06-21', 'DEVUELTO', '5', '9c28b188-ba6c-4e10-ab66-00de594f74cb', '2', '0', '2026-06-11 12:44:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000243', '2026-09-17 16:41:00-05', '2026-09-28', '2026-09-25', 'DEVUELTO', '5', 'bf4fe9dc-42b5-4b7a-b75d-6093bfbb8e50', '2', '0', '2026-09-17 16:46:00-05', 'REGULAR', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000015', '2024-03-01 12:40:00-05', '2024-03-07', '2024-03-06', 'DEVUELTO', '6', 'ec06f059-882b-45e0-92d8-84b856c607d0', '2', '0', '2024-03-01 12:45:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000036', '2024-06-19 13:50:00-05', '2024-06-25', '2024-06-23', 'DEVUELTO', '6', '9ca2c57c-befc-4fcb-be0e-e5777d0ad2c7', '2', '0', '2024-06-19 13:55:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000057', '2024-09-07 11:07:00-05', '2024-09-13', '2024-09-12', 'DEVUELTO', '6', '50555cd6-0356-46ed-ae60-3d583a91ab7c', '2', '0', '2024-09-07 11:12:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000064', '2024-10-04 15:22:00-05', NULL, NULL, 'CANCELADO', '6', 'c68931a9-19a4-4ff7-aa3e-de0e7e2d4cc0', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000078', '2024-11-21 15:23:00-05', '2024-11-27', '2024-11-27', 'DEVUELTO', '6', '79fd47c8-5157-4d10-9ff6-50273bac24e2', '2', '0', '2024-11-21 15:28:00-05', 'DANADO', 'Devuelto con danos; reparado.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000099', '2025-02-19 09:34:00-05', NULL, NULL, 'CANCELADO', '6', '5e610702-2aae-4204-a83c-fac3f9e9ffcb', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000120', '2025-04-25 09:42:00-05', '2025-05-01', '2025-04-30', 'DEVUELTO', '6', '3195fd4d-04b0-4be5-ab34-42a06d10b1ce', '2', '0', '2025-04-25 09:47:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000134', '2025-06-11 15:39:00-05', NULL, NULL, 'CANCELADO', '6', 'f84128cf-ebea-43c9-b59b-36bb3f302bfe', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000141', '2025-07-07 15:52:00-05', '2025-07-13', '2025-07-10', 'DEVUELTO', '6', 'b82e22cf-c1c3-4cec-b661-0d6f6eb4ebe6', '2', '0', '2025-07-07 15:57:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000162', '2025-10-11 12:23:00-05', '2025-10-17', '2025-10-14', 'DEVUELTO', '6', '90c8b46d-6f3d-4460-bcc5-83af267f6f8d', '2', '0', '2025-10-11 12:28:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000183', '2025-12-25 12:45:00-05', '2025-12-31', '2025-12-29', 'DEVUELTO', '6', '0e4969cc-ebde-490d-a6bc-eb01c1785a29', '2', '0', '2025-12-25 12:50:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000204', '2026-03-23 08:46:00-05', '2026-03-29', '2026-03-27', 'DEVUELTO', '6', '419cfd51-b7cc-49d0-9e72-c39656c2a269', '2', '0', '2026-03-23 08:51:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000225', '2026-07-01 16:45:00-05', '2026-07-07', '2026-07-05', 'DEVUELTO', '6', 'e23f39d5-6f94-4e1a-b364-4ab881ea4e22', '2', '0', '2026-07-01 16:50:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000009', '2024-02-07 14:44:00-05', NULL, NULL, 'CANCELADO', '8', '33356303-d3c9-4cb2-a281-3ce2deefbba9', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000030', '2024-05-21 12:48:00-05', NULL, NULL, 'CANCELADO', '8', 'd67dbfe8-7b8b-4f19-93a8-b3c57bc083f1', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000051', '2024-08-12 12:47:00-05', '2024-08-18', '2024-08-16', 'DEVUELTO', '8', 'db7eecb7-8397-4791-b7d9-df45ace4aff0', '2', '0', '2024-08-12 12:52:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000058', '2024-09-11 15:57:00-05', NULL, NULL, 'CANCELADO', '8', '0172f5aa-52b5-4d6a-acf0-112bb141286c', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000072', '2024-11-01 14:50:00-05', '2024-11-07', '2024-11-07', 'DEVUELTO', '8', '279020f8-df8e-4f44-8d32-c46b37643faa', '2', '0', '2024-11-01 14:55:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000093', '2025-01-17 10:53:00-05', '2025-01-23', '2025-01-22', 'DEVUELTO', '8', 'af393b91-d38c-43b0-9b8b-17b32957bf06', '2', '0', '2025-01-17 10:58:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000100', '2025-02-23 10:06:00-05', NULL, NULL, 'CANCELADO', '8', 'f3458340-afe2-4a00-97a0-f9cdf99601bc', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000114', '2025-04-09 12:34:00-05', '2025-04-15', '2025-04-13', 'DEVUELTO', '8', '80e2c15c-4a4c-4679-b63b-2f47a62d6ca6', '2', '0', '2025-04-09 12:39:00-05', 'REGULAR', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000121', '2025-05-01 15:13:00-05', NULL, NULL, 'CANCELADO', '8', '390b424b-7d32-46b8-a56d-d5794250eca1', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000135', '2025-06-14 16:59:00-05', '2025-06-20', '2025-06-22', 'DEVUELTO', '8', 'c6ce2a43-8598-4d70-98f0-acff7c21ea0a', '2', '0', '2025-06-14 17:04:00-05', 'BUENO', 'Devuelto con 2 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000149', '2025-08-04 08:38:00-05', NULL, NULL, 'CANCELADO', '8', '50555cd6-0356-46ed-ae60-3d583a91ab7c', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000156', '2025-09-06 14:03:00-05', '2025-09-12', '2025-09-09', 'DEVUELTO', '8', 'c68931a9-19a4-4ff7-aa3e-de0e7e2d4cc0', '2', '0', '2025-09-06 14:08:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000177', '2025-12-07 15:24:00-05', '2025-12-13', '2025-12-11', 'DEVUELTO', '8', '27c3ed9e-4b75-4e31-af4b-dffbf18859f7', '2', '0', '2025-12-07 15:29:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000198', '2026-02-23 16:49:00-05', '2026-03-01', '2026-03-02', 'DEVUELTO', '8', '7de93987-b876-4c69-8aed-4a80ddec646a', '2', '0', '2026-02-23 16:54:00-05', 'BUENO', 'Devuelto con 1 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000219', '2026-05-25 15:54:00-05', '2026-05-31', '2026-05-28', 'DEVUELTO', '8', 'ede92d0e-3605-460f-a886-fcb0ce1a1361', '2', '0', '2026-05-25 15:59:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000240', '2026-09-01 13:31:00-05', '2026-09-07', '2026-09-06', 'DEVUELTO', '8', '0820c19b-9a17-4ede-8164-83016dcf62a8', '2', '0', '2026-09-01 13:36:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000006', '2024-01-23 14:49:00-05', '2024-02-03', '2024-01-31', 'DEVUELTO', '9', '1941b7c8-6c7a-4686-97b3-16b9d0c4c5bb', '2', '0', '2024-01-23 14:54:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000027', '2024-05-11 12:53:00-05', '2024-05-22', '2024-05-19', 'DEVUELTO', '9', '4fe51bc9-fcd5-4195-a7ed-d95cba2cb4d7', '2', '0', '2024-05-11 12:58:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000048', '2024-08-01 08:16:00-05', NULL, NULL, 'CANCELADO', '9', 'b01b6b4d-6cd9-4319-8c82-9c272a9e8b25', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000069', '2024-10-19 12:58:00-05', '2024-10-30', '2024-10-27', 'DEVUELTO', '9', 'c923d8db-619f-411a-89b1-09fa188573ba', '2', '0', '2024-10-19 13:03:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000090', '2025-01-01 15:57:00-05', '2025-01-12', '2025-01-09', 'DEVUELTO', '9', 'fdd3bc59-051d-4255-a36b-14f8b242aa40', '2', '0', '2025-01-01 16:02:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000097', '2025-02-10 11:09:00-05', NULL, NULL, 'CANCELADO', '9', 'a3948e7d-7b76-4d2f-8bc5-a4dc13a8672a', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000111', '2025-04-01 16:37:00-05', '2025-04-12', '2025-04-10', 'DEVUELTO', '9', '6965bde1-c1cc-4a14-8225-46c7d843aa7a', '2', '0', '2025-04-01 16:42:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000132', '2025-06-04 10:48:00-05', '2025-06-15', '2025-06-13', 'DEVUELTO', '9', '131a4904-044b-468b-8981-80816734f928', '2', '0', '2025-06-04 10:53:00-05', 'DANADO', 'Devuelto con danos; reparado.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000153', '2025-08-20 13:37:00-05', '2025-08-31', '2025-08-30', 'DEVUELTO', '9', '40daf96e-65f2-4721-a225-2bc9f449884a', '2', '0', '2025-08-20 13:42:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000174', '2025-11-25 11:34:00-05', '2025-12-06', '2025-12-03', 'DEVUELTO', '9', 'c7814a52-7163-48af-bad5-016ff1791768', '2', '0', '2025-11-25 11:39:00-05', 'REGULAR', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000181', '2025-12-19 15:36:00-05', NULL, NULL, 'CANCELADO', '9', '306207c2-11db-433c-83c3-92768f537d16', NULL, '0', NULL, NULL, 'Reserva cancelada por el usuario.', NULL),
        ('5eed0000-0000-4000-8000-000000000195', '2026-02-10 14:56:00-05', '2026-02-21', '2026-02-21', 'DEVUELTO', '9', '48e70b56-3157-409b-af96-fd874858c9c8', '2', '0', '2026-02-10 15:01:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000216', '2026-05-16 14:51:00-05', '2026-05-27', '2026-05-31', 'DEVUELTO', '9', 'fd878753-1fc3-44db-8de3-533c916423c7', '2', '0', '2026-05-16 14:56:00-05', 'BUENO', 'Devuelto con 4 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000237', '2026-08-16 14:58:00-05', '2026-08-27', '2026-08-24', 'DEVUELTO', '9', '0972384e-d226-4eb2-91b0-cf9d63c96c41', '2', '0', '2026-08-16 15:03:00-05', 'BUENO', '', 'BUENO'),
        ('143ace13-2eab-4b75-a0e6-20e0acfe21bd', '2026-11-18 04:11:55.345795-05', '2026-12-03', NULL, 'ACTIVO', '5', '6dcc8513-6763-4ceb-a04b-1f21d69bc1bd', '2', '0', '2026-11-18 04:11:55.323187-05', NULL, '', 'BUENO'),
        ('e7e891c2-7e52-4323-9a5e-279bba25cabf', '2026-11-18 10:00:00-05', NULL, NULL, 'RESERVADO', '6', 'e23f39d5-6f94-4e1a-b364-4ab881ea4e22', NULL, '0', NULL, NULL, 'Reserva pendiente de entrega.', NULL),
        ('5eed0000-0000-4000-8000-000000000052', '2024-08-16 14:28:00-05', '2024-08-27', '2024-08-31', 'DEVUELTO', '1', 'e943b71e-9832-4904-939f-46c89c96b28f', '2', '0', '2024-08-16 14:33:00-05', 'BUENO', 'Devuelto con 4 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000073', '2024-11-04 15:09:00-05', '2024-11-15', '2024-11-15', 'DEVUELTO', '1', 'a7cf2e6a-1bb3-48a9-a816-2f61d05bfc71', '2', '0', '2024-11-04 15:14:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000080', '2024-12-01 13:21:00-05', '2024-12-12', '2024-12-09', 'DEVUELTO', '1', '4317821c-eba8-446c-b41f-60f7d7afca5a', '2', '0', '2024-12-01 13:26:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000094', '2025-01-22 14:06:00-05', '2025-02-02', '2025-01-30', 'DEVUELTO', '1', '2257abf8-a7aa-419d-85f3-71bae156bf58', '2', '0', '2025-01-22 14:11:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000101', '2025-03-01 12:24:00-05', '2025-03-12', '2025-03-11', 'DEVUELTO', '1', '33356303-d3c9-4cb2-a281-3ce2deefbba9', '2', '0', '2025-03-01 12:29:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000115', '2025-04-11 09:41:00-05', '2025-04-22', '2025-04-20', 'DEVUELTO', '1', 'e9cc1320-b939-4f0e-8662-3610c7e557b3', '2', '0', '2025-04-11 09:46:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000122', '2025-05-03 08:47:00-05', '2025-05-14', '2025-05-11', 'DEVUELTO', '1', 'd67dbfe8-7b8b-4f19-93a8-b3c57bc083f1', '2', '0', '2025-05-03 08:52:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000136', '2025-06-17 15:46:00-05', '2025-06-28', '2025-06-28', 'DEVUELTO', '1', 'b83b4866-3bac-4b1f-9ca1-d1373ab13acc', '2', '0', '2025-06-17 15:51:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000143', '2025-07-13 13:28:00-05', '2025-07-24', '2025-07-27', 'DEVUELTO', '1', 'db7eecb7-8397-4791-b7d9-df45ace4aff0', '2', '0', '2025-07-13 13:33:00-05', 'BUENO', 'Devuelto con 3 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000157', '2025-09-11 11:16:00-05', '2025-09-22', '2025-09-21', 'DEVUELTO', '1', 'bb9efe46-fa46-4353-881e-e53eb5bb915b', '2', '0', '2025-09-11 11:21:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000164', '2025-10-22 13:38:00-05', '2025-11-02', '2025-11-02', 'DEVUELTO', '1', '279020f8-df8e-4f44-8d32-c46b37643faa', '2', '0', '2025-10-22 13:43:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000178', '2025-12-10 08:05:00-05', '2025-12-21', '2025-12-20', 'DEVUELTO', '1', 'e702d153-c268-437f-a482-665c0f9dc600', '2', '0', '2025-12-10 08:10:00-05', 'REGULAR', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000185', '2026-01-04 16:38:00-05', '2026-01-15', '2026-01-13', 'DEVUELTO', '1', 'af393b91-d38c-43b0-9b8b-17b32957bf06', '2', '0', '2026-01-04 16:43:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000199', '2026-03-01 15:31:00-05', '2026-03-12', '2026-03-09', 'DEVUELTO', '1', 'ec06f059-882b-45e0-92d8-84b856c607d0', '2', '0', '2026-03-01 15:36:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000206', '2026-04-05 16:21:00-05', '2026-04-16', '2026-04-15', 'DEVUELTO', '1', '80e2c15c-4a4c-4679-b63b-2f47a62d6ca6', '2', '0', '2026-04-05 16:26:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000220', '2026-06-01 09:15:00-05', '2026-06-12', '2026-06-12', 'DEVUELTO', '1', '9ca2c57c-befc-4fcb-be0e-e5777d0ad2c7', '2', '0', '2026-06-01 09:20:00-05', 'REGULAR', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000227', '2026-07-07 13:06:00-05', '2026-07-18', '2026-07-17', 'DEVUELTO', '1', 'c6ce2a43-8598-4d70-98f0-acff7c21ea0a', '2', '0', '2026-07-07 13:11:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000241', '2026-09-06 12:36:00-05', '2026-09-17', '2026-09-17', 'DEVUELTO', '1', '50555cd6-0356-46ed-ae60-3d583a91ab7c', '2', '0', '2026-09-06 12:41:00-05', 'REGULAR', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000014', '2024-02-24 12:49:00-05', '2024-03-01', '2024-03-01', 'DEVUELTO', '3', '7de93987-b876-4c69-8aed-4a80ddec646a', '2', '0', '2024-02-24 12:54:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000028', '2024-05-14 10:37:00-05', '2024-05-20', '2024-05-24', 'DEVUELTO', '3', '3195fd4d-04b0-4be5-ab34-42a06d10b1ce', '2', '0', '2024-05-14 10:42:00-05', 'BUENO', 'Devuelto con 4 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000049', '2024-08-04 09:21:00-05', '2024-08-10', '2024-08-09', 'DEVUELTO', '3', 'b82e22cf-c1c3-4cec-b661-0d6f6eb4ebe6', '2', '0', '2024-08-04 09:26:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000056', '2024-09-04 14:43:00-05', '2024-09-10', '2024-09-09', 'DEVUELTO', '3', '0820c19b-9a17-4ede-8164-83016dcf62a8', '2', '0', '2024-09-04 14:48:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000070', '2024-10-22 16:21:00-05', '2024-10-28', '2024-10-25', 'DEVUELTO', '3', '90c8b46d-6f3d-4460-bcc5-83af267f6f8d', '2', '0', '2024-10-22 16:26:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000077', '2024-11-17 12:04:00-05', '2024-11-23', '2024-11-23', 'DEVUELTO', '3', 'ed42b22b-0f9d-466a-a2be-e43cf271cda6', '2', '0', '2024-11-17 12:09:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000091', '2025-01-06 13:00:00-05', '2025-01-12', '2025-01-11', 'DEVUELTO', '3', '0e4969cc-ebde-490d-a6bc-eb01c1785a29', '2', '0', '2025-01-06 13:05:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000098', '2025-02-14 11:06:00-05', '2025-02-20', '2025-02-17', 'DEVUELTO', '3', '1941b7c8-6c7a-4686-97b3-16b9d0c4c5bb', '2', '0', '2025-02-14 11:11:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000112', '2025-04-03 16:06:00-05', '2025-04-09', '2025-04-06', 'DEVUELTO', '3', '419cfd51-b7cc-49d0-9e72-c39656c2a269', '2', '0', '2025-04-03 16:11:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000119', '2025-04-22 09:40:00-05', '2025-04-28', '2025-04-26', 'DEVUELTO', '3', '4fe51bc9-fcd5-4195-a7ed-d95cba2cb4d7', '2', '0', '2025-04-22 09:45:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000133', '2025-06-07 16:50:00-05', '2025-06-13', '2025-06-17', 'DEVUELTO', '3', 'e23f39d5-6f94-4e1a-b364-4ab881ea4e22', '2', '0', '2025-06-07 16:55:00-05', 'BUENO', 'Devuelto con 4 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000140', '2025-07-04 15:26:00-05', '2025-07-10', '2025-07-08', 'DEVUELTO', '3', 'b01b6b4d-6cd9-4319-8c82-9c272a9e8b25', '2', '0', '2025-07-04 15:31:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000154', '2025-08-24 11:43:00-05', '2025-08-30', '2025-08-29', 'DEVUELTO', '3', 'fbf23f73-e6df-4708-9665-66cbf7f80af5', '2', '0', '2025-08-24 11:48:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000161', '2025-10-06 09:35:00-05', '2025-10-12', '2025-10-10', 'DEVUELTO', '3', 'c923d8db-619f-411a-89b1-09fa188573ba', '2', '0', '2025-10-06 09:40:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000175', '2025-12-01 11:49:00-05', '2025-12-07', '2025-12-06', 'DEVUELTO', '3', '0cf39221-522a-4b78-8487-926c4ab4be2b', '2', '0', '2025-12-01 11:54:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000182', '2025-12-22 13:57:00-05', '2025-12-28', '2025-12-25', 'DEVUELTO', '3', 'fdd3bc59-051d-4255-a36b-14f8b242aa40', '2', '0', '2025-12-22 14:02:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000196', '2026-02-14 08:27:00-05', '2026-02-20', '2026-02-17', 'DEVUELTO', '3', '16482725-961c-45c8-bf2e-85f298b98483', '2', '0', '2026-02-14 08:32:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000203', '2026-03-19 15:41:00-05', '2026-03-25', '2026-03-22', 'DEVUELTO', '3', '6965bde1-c1cc-4a14-8225-46c7d843aa7a', '2', '0', '2026-03-19 15:46:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000217', '2026-05-19 13:22:00-05', '2026-05-25', '2026-05-25', 'DEVUELTO', '3', 'ab863557-5782-40f8-88a3-f43192e98f8a', '2', '0', '2026-05-19 13:27:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000224', '2026-06-22 12:57:00-05', '2026-06-28', '2026-06-30', 'DEVUELTO', '3', '131a4904-044b-468b-8981-80816734f928', '2', '0', '2026-06-22 13:02:00-05', 'BUENO', 'Devuelto con 2 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000238', '2026-08-20 15:57:00-05', '2026-08-26', '2026-08-25', 'DEVUELTO', '3', '9221b731-93b4-4918-aeb9-86a4e94d6bd5', '2', '0', '2026-08-20 16:02:00-05', 'BUENO', '', 'REGULAR'),
        ('5eed0000-0000-4000-8000-000000000004', '2024-01-14 13:07:00-05', '2024-01-25', '2024-01-22', 'DEVUELTO', '4', '440e1aeb-0eec-4ee0-b6dc-8b53857d8cd8', '2', '0', '2024-01-14 13:12:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000011', '2024-02-14 16:27:00-05', '2024-02-25', '2024-02-24', 'DEVUELTO', '4', '48e70b56-3157-409b-af96-fd874858c9c8', '2', '0', '2024-02-14 16:32:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000025', '2024-05-04 12:07:00-05', '2024-05-15', '2024-05-14', 'DEVUELTO', '4', '53bd2ee3-2cb6-45c3-a3e0-b5459d06e595', '2', '0', '2024-05-04 12:12:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000032', '2024-06-01 16:25:00-05', '2024-06-12', '2024-06-11', 'DEVUELTO', '4', 'fd878753-1fc3-44db-8de3-533c916423c7', '2', '0', '2024-06-01 16:30:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000046', '2024-07-22 10:39:00-05', '2024-08-02', '2024-08-05', 'DEVUELTO', '4', '95fabcb1-f91a-4720-9535-8bf6c18186ec', '2', '0', '2024-07-22 10:44:00-05', 'REGULAR', 'Devuelto con 3 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000053', '2024-08-20 11:57:00-05', '2024-08-31', '2024-08-31', 'DEVUELTO', '4', '0972384e-d226-4eb2-91b0-cf9d63c96c41', '2', '0', '2024-08-20 12:02:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000067', '2024-10-13 09:28:00-05', '2024-10-24', '2024-10-22', 'DEVUELTO', '4', '9fd9e265-c889-42bb-9f1c-f17a08b17a07', '2', '0', '2024-10-13 09:33:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000074', '2024-11-07 13:44:00-05', '2024-11-18', '2024-11-18', 'DEVUELTO', '4', '2ba5e115-dd08-411f-86da-9bb0bcb1487d', '2', '0', '2024-11-07 13:49:00-05', 'DANADO', 'Devuelto con danos; reparado.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000088', '2024-12-22 14:35:00-05', '2025-01-02', '2025-01-02', 'DEVUELTO', '4', '0555c0e6-f827-44c5-a327-8de439539f2d', '2', '0', '2024-12-22 14:40:00-05', 'DANADO', 'Devuelto con danos; reparado.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000109', '2025-03-22 11:25:00-05', '2025-04-02', '2025-04-03', 'DEVUELTO', '4', 'b5a1718c-0df7-4917-8ccf-a6b43a9b4cf3', '2', '0', '2025-03-22 11:30:00-05', 'BUENO', 'Devuelto con 1 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000116', '2025-04-14 08:26:00-05', '2025-04-25', '2025-04-25', 'DEVUELTO', '4', '92c7743e-c450-4f46-aa9e-fda533a05d94', '2', '0', '2025-04-14 08:31:00-05', 'REGULAR', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000130', '2025-05-25 14:39:00-05', '2025-06-05', '2025-06-02', 'DEVUELTO', '4', '9c28b188-ba6c-4e10-ab66-00de594f74cb', '2', '0', '2025-05-25 14:44:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000137', '2025-06-21 15:52:00-05', '2025-07-02', '2025-06-29', 'DEVUELTO', '4', '0ff6a327-c727-4634-94f0-db62e021971a', '2', '0', '2025-06-21 15:57:00-05', 'REGULAR', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000151', '2025-08-12 16:54:00-05', '2025-08-23', '2025-08-21', 'DEVUELTO', '4', 'bf4fe9dc-42b5-4b7a-b75d-6093bfbb8e50', '2', '0', '2025-08-12 16:59:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000172', '2025-11-19 08:36:00-05', '2025-11-30', '2025-11-30', 'DEVUELTO', '4', '4317821c-eba8-446c-b41f-60f7d7afca5a', '2', '0', '2025-11-19 08:41:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000179', '2025-12-13 10:48:00-05', '2025-12-24', '2025-12-27', 'DEVUELTO', '4', 'c14d7972-2a97-49ac-99ff-0fd210e1aae3', '2', '0', '2025-12-13 10:53:00-05', 'BUENO', 'Devuelto con 3 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000193', '2026-02-01 12:43:00-05', '2026-02-12', '2026-02-10', 'DEVUELTO', '4', '33356303-d3c9-4cb2-a281-3ce2deefbba9', '2', '0', '2026-02-01 12:48:00-05', 'REGULAR', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000200', '2026-03-05 09:46:00-05', '2026-03-16', '2026-03-13', 'DEVUELTO', '4', '6bd46d0c-015c-4512-81df-653f8a93f8b5', '2', '0', '2026-03-05 09:51:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000214', '2026-05-10 15:21:00-05', '2026-05-21', '2026-05-20', 'DEVUELTO', '4', 'd67dbfe8-7b8b-4f19-93a8-b3c57bc083f1', '2', '0', '2026-05-10 15:26:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000221', '2026-06-06 14:22:00-05', '2026-06-17', '2026-06-17', 'DEVUELTO', '4', '78009382-cc75-42e2-bf89-1ef9f9fbd3c5', '2', '0', '2026-06-06 14:27:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000235', '2026-08-08 09:53:00-05', '2026-08-19', '2026-08-17', 'DEVUELTO', '4', 'db7eecb7-8397-4791-b7d9-df45ace4aff0', '2', '0', '2026-08-08 09:58:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000242', '2026-09-11 09:46:00-05', '2026-09-22', '2026-09-21', 'DEVUELTO', '4', '0172f5aa-52b5-4d6a-acf0-112bb141286c', '2', '0', '2026-09-11 09:51:00-05', 'REGULAR', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000019', '2024-03-22 12:40:00-05', '2024-04-02', '2024-04-02', 'DEVUELTO', '5', '6965bde1-c1cc-4a14-8225-46c7d843aa7a', '2', '0', '2024-03-22 12:45:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000026', '2024-05-07 09:58:00-05', '2024-05-18', '2024-05-17', 'DEVUELTO', '5', '0edef5ab-f20e-4be1-91d0-7f63519e872f', '2', '0', '2024-05-07 10:03:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000040', '2024-07-06 08:58:00-05', '2024-07-17', '2024-07-16', 'DEVUELTO', '5', '131a4904-044b-468b-8981-80816734f928', '2', '0', '2024-07-06 09:03:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000047', '2024-07-25 09:43:00-05', '2024-08-05', '2024-08-02', 'DEVUELTO', '5', '8560cff4-e270-48fd-8778-6e6f15ffaa1a', '2', '0', '2024-07-25 09:48:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000061', '2024-09-21 10:09:00-05', '2024-10-02', '2024-09-30', 'DEVUELTO', '5', '40daf96e-65f2-4721-a225-2bc9f449884a', '2', '0', '2024-09-21 10:14:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000068', '2024-10-16 16:07:00-05', '2024-10-27', '2024-10-29', 'DEVUELTO', '5', 'ebcd1803-0db3-4726-b3ad-09a8c8ecfcb3', '2', '0', '2024-10-16 16:12:00-05', 'BUENO', 'Devuelto con 2 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000082', '2024-12-06 16:59:00-05', '2024-12-17', '2024-12-14', 'DEVUELTO', '5', 'c7814a52-7163-48af-bad5-016ff1791768', '2', '0', '2024-12-06 17:04:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000089', '2024-12-25 11:27:00-05', '2025-01-05', '2025-01-04', 'DEVUELTO', '5', '306207c2-11db-433c-83c3-92768f537d16', '2', '0', '2024-12-25 11:32:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000103', '2025-03-06 12:23:00-05', '2025-03-17', '2025-03-16', 'DEVUELTO', '5', '48e70b56-3157-409b-af96-fd874858c9c8', '2', '0', '2025-03-06 12:28:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000110', '2025-03-25 11:58:00-05', '2025-04-05', '2025-04-03', 'DEVUELTO', '5', '5cf66d1e-6516-482c-9b7a-17a6f315a129', '2', '0', '2025-03-25 12:03:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000131', '2025-06-01 10:23:00-05', '2025-06-12', '2025-06-10', 'DEVUELTO', '5', 'ba0d7265-71d6-4dbe-a8af-fbb88413801f', '2', '0', '2025-06-01 10:28:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000145', '2025-07-19 08:45:00-05', '2025-07-30', '2025-07-27', 'DEVUELTO', '5', '0972384e-d226-4eb2-91b0-cf9d63c96c41', '2', '0', '2025-07-19 08:50:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000152', '2025-08-16 08:56:00-05', '2025-08-27', '2025-08-25', 'DEVUELTO', '5', '12687558-8661-4cf2-ba47-da34026dabd8', '2', '0', '2025-08-16 09:01:00-05', 'DANADO', 'Devuelto con danos; reparado.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000166', '2025-11-03 09:14:00-05', '2025-11-14', '2025-11-12', 'DEVUELTO', '5', '2ba5e115-dd08-411f-86da-9bb0bcb1487d', '2', '0', '2025-11-03 09:19:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000173', '2025-11-22 11:50:00-05', '2025-12-03', '2025-12-01', 'DEVUELTO', '5', 'ce05869b-607b-4be6-a05c-b95b61a7b8f5', '2', '0', '2025-11-22 11:55:00-05', 'REGULAR', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000187', '2026-01-10 08:50:00-05', '2026-01-21', '2026-01-19', 'DEVUELTO', '5', '2d763b68-8365-4502-b781-3ebde99d927c', '2', '0', '2026-01-10 08:55:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000194', '2026-02-05 08:24:00-05', '2026-02-16', '2026-02-14', 'DEVUELTO', '5', '20a5d89e-e1d4-4687-b7af-46560013fbf6', '2', '0', '2026-02-05 08:29:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000208', '2026-04-14 14:14:00-05', '2026-04-25', '2026-04-23', 'DEVUELTO', '5', '92c7743e-c450-4f46-aa9e-fda533a05d94', '2', '0', '2026-04-14 14:19:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000215', '2026-05-13 14:29:00-05', '2026-05-24', '2026-05-22', 'DEVUELTO', '5', 'dad0936a-795e-4d24-b90b-c410b74f0bf0', '2', '0', '2026-05-13 14:34:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000229', '2026-07-14 14:01:00-05', '2026-07-25', '2026-07-24', 'DEVUELTO', '5', '0ff6a327-c727-4634-94f0-db62e021971a', '2', '0', '2026-07-14 14:06:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000236', '2026-08-12 14:54:00-05', '2026-08-23', '2026-08-20', 'DEVUELTO', '5', 'e943b71e-9832-4904-939f-46c89c96b28f', '2', '0', '2026-08-12 14:59:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000001', '2024-01-01 11:01:00-05', '2024-01-07', '2024-01-10', 'DEVUELTO', '6', 'af393b91-d38c-43b0-9b8b-17b32957bf06', '2', '0', '2024-01-01 11:06:00-05', 'BUENO', 'Devuelto con 3 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000008', '2024-02-04 11:38:00-05', '2024-02-10', '2024-02-08', 'DEVUELTO', '6', 'f3458340-afe2-4a00-97a0-f9cdf99601bc', '2', '0', '2024-02-04 11:43:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000022', '2024-04-14 14:28:00-05', '2024-04-20', '2024-04-18', 'DEVUELTO', '6', '80e2c15c-4a4c-4679-b63b-2f47a62d6ca6', '2', '0', '2024-04-14 14:33:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000029', '2024-05-17 15:42:00-05', '2024-05-23', '2024-05-20', 'DEVUELTO', '6', '390b424b-7d32-46b8-a56d-d5794250eca1', '2', '0', '2024-05-17 15:47:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000043', '2024-07-14 16:45:00-05', '2024-07-20', '2024-07-20', 'DEVUELTO', '6', 'c6ce2a43-8598-4d70-98f0-acff7c21ea0a', '2', '0', '2024-07-14 16:50:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000050', '2024-08-08 13:10:00-05', '2024-08-14', '2024-08-16', 'DEVUELTO', '6', 'f9ed279e-0c46-429d-a327-b040e000f096', '2', '0', '2024-08-08 13:15:00-05', 'BUENO', 'Devuelto con 2 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000071', '2024-10-25 16:02:00-05', '2024-10-31', '2024-10-29', 'DEVUELTO', '6', 'c718c59c-3248-43cc-9201-2933cbd863b5', '2', '0', '2024-10-25 16:07:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000085', '2024-12-14 08:26:00-05', '2024-12-20', '2024-12-20', 'DEVUELTO', '6', '27c3ed9e-4b75-4e31-af4b-dffbf18859f7', '2', '0', '2024-12-14 08:31:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000092', '2025-01-11 09:54:00-05', '2025-01-17', '2025-01-22', 'DEVUELTO', '6', '46ad431c-a997-4e3c-ad99-547ea10d21e0', '2', '0', '2025-01-11 09:59:00-05', 'BUENO', 'Devuelto con 5 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000106', '2025-03-14 12:02:00-05', '2025-03-20', '2025-03-19', 'DEVUELTO', '6', '7de93987-b876-4c69-8aed-4a80ddec646a', '2', '0', '2025-03-14 12:07:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000113', '2025-04-06 11:03:00-05', '2025-04-12', '2025-04-09', 'DEVUELTO', '6', '93d7e44a-222d-490c-b565-b0df0e0084b4', '2', '0', '2025-04-06 11:08:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000127', '2025-05-17 12:32:00-05', '2025-05-23', '2025-05-22', 'DEVUELTO', '6', 'ede92d0e-3605-460f-a886-fcb0ce1a1361', '2', '0', '2025-05-17 12:37:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000148', '2025-08-01 15:57:00-05', '2025-08-07', '2025-08-07', 'DEVUELTO', '6', '0820c19b-9a17-4ede-8164-83016dcf62a8', '2', '0', '2025-08-01 16:02:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000155', '2025-09-01 16:50:00-05', '2025-09-07', '2025-09-06', 'DEVUELTO', '6', '959fa446-e194-4556-9464-f969a134f138', '2', '0', '2025-09-01 16:55:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000169', '2025-11-11 13:00:00-05', '2025-11-17', '2025-11-14', 'DEVUELTO', '6', 'ed42b22b-0f9d-466a-a2be-e43cf271cda6', '2', '0', '2025-11-11 13:05:00-05', 'DANADO', 'Devuelto con danos; reparado.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000176', '2025-12-04 10:24:00-05', '2025-12-10', '2025-12-10', 'DEVUELTO', '6', '3b746721-cb5a-473a-b922-90d1357577d4', '2', '0', '2025-12-04 10:29:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000190', '2026-01-19 08:27:00-05', '2026-01-25', '2026-01-24', 'DEVUELTO', '6', '1941b7c8-6c7a-4686-97b3-16b9d0c4c5bb', '2', '0', '2026-01-19 08:32:00-05', 'DANADO', 'Devuelto con danos; reparado.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000197', '2026-02-19 08:52:00-05', '2026-02-25', '2026-02-24', 'DEVUELTO', '6', '7293ab36-043e-44ff-9e39-2a5046928d38', '2', '0', '2026-02-19 08:57:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000211', '2026-05-01 15:29:00-05', '2026-05-07', '2026-05-05', 'DEVUELTO', '6', '4fe51bc9-fcd5-4195-a7ed-d95cba2cb4d7', '2', '0', '2026-05-01 15:34:00-05', 'REGULAR', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000218', '2026-05-22 13:35:00-05', '2026-05-28', '2026-05-28', 'DEVUELTO', '6', '091c6bbe-2f30-421a-af86-231d6fa0da36', '2', '0', '2026-05-22 13:40:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000232', '2026-07-24 11:35:00-05', '2026-07-30', '2026-07-27', 'DEVUELTO', '6', 'b01b6b4d-6cd9-4319-8c82-9c272a9e8b25', '2', '0', '2026-07-24 11:40:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000239', '2026-08-24 13:18:00-05', '2026-08-30', '2026-08-30', 'DEVUELTO', '6', 'eb0a8a82-c3bb-4e8a-95b5-361503e73963', '2', '0', '2026-08-24 13:23:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000002', '2024-01-05 09:30:00-05', '2024-01-11', '2024-01-11', 'DEVUELTO', '8', '2257abf8-a7aa-419d-85f3-71bae156bf58', '2', '0', '2024-01-05 09:35:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000016', '2024-03-06 16:19:00-05', '2024-03-12', '2024-03-17', 'DEVUELTO', '8', '6bd46d0c-015c-4512-81df-653f8a93f8b5', '2', '0', '2024-03-06 16:24:00-05', 'REGULAR', 'Devuelto con 5 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000023', '2024-04-21 15:25:00-05', '2024-04-27', '2024-04-27', 'DEVUELTO', '8', 'e9cc1320-b939-4f0e-8662-3610c7e557b3', '2', '0', '2024-04-21 15:30:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000037', '2024-06-23 13:29:00-05', '2024-06-29', '2024-06-27', 'DEVUELTO', '8', '78009382-cc75-42e2-bf89-1ef9f9fbd3c5', '2', '0', '2024-06-23 13:34:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000044', '2024-07-17 14:20:00-05', '2024-07-23', '2024-07-23', 'DEVUELTO', '8', 'b83b4866-3bac-4b1f-9ca1-d1373ab13acc', '2', '0', '2024-07-17 14:25:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000065', '2024-10-07 13:22:00-05', '2024-10-13', '2024-10-14', 'DEVUELTO', '8', 'bb9efe46-fa46-4353-881e-e53eb5bb915b', '2', '0', '2024-10-07 13:27:00-05', 'BUENO', 'Devuelto con 1 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000079', '2024-11-24 14:31:00-05', '2024-11-30', '2024-12-01', 'DEVUELTO', '8', '57afbfd4-54a4-4c66-a888-9ada6cc0bd3c', '2', '0', '2024-11-24 14:36:00-05', 'BUENO', 'Devuelto con 1 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000086', '2024-12-17 16:20:00-05', '2024-12-23', '2024-12-23', 'DEVUELTO', '8', 'e702d153-c268-437f-a482-665c0f9dc600', '2', '0', '2024-12-17 16:25:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000107', '2025-03-17 09:47:00-05', '2025-03-23', '2025-03-20', 'DEVUELTO', '8', 'ec06f059-882b-45e0-92d8-84b856c607d0', '2', '0', '2025-03-17 09:52:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000128', '2025-05-19 08:02:00-05', '2025-05-25', '2025-05-24', 'DEVUELTO', '8', '9ca2c57c-befc-4fcb-be0e-e5777d0ad2c7', '2', '0', '2025-05-19 08:07:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000142', '2025-07-10 15:21:00-05', '2025-07-16', '2025-07-17', 'DEVUELTO', '8', 'f9ed279e-0c46-429d-a327-b040e000f096', '2', '0', '2025-07-10 15:26:00-05', 'BUENO', 'Devuelto con 1 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000163', '2025-10-17 15:51:00-05', '2025-10-23', '2025-10-22', 'DEVUELTO', '8', 'c718c59c-3248-43cc-9201-2933cbd863b5', '2', '0', '2025-10-17 15:56:00-05', 'REGULAR', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000170', '2025-11-14 12:46:00-05', '2025-11-20', '2025-11-18', 'DEVUELTO', '8', '79fd47c8-5157-4d10-9ff6-50273bac24e2', '2', '0', '2025-11-14 12:51:00-05', 'DANADO', 'Devuelto con danos; reparado.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000184', '2026-01-01 13:33:00-05', '2026-01-07', '2026-01-06', 'DEVUELTO', '8', '46ad431c-a997-4e3c-ad99-547ea10d21e0', '2', '0', '2026-01-01 13:38:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000191', '2026-01-22 13:49:00-05', '2026-01-28', '2026-01-25', 'DEVUELTO', '8', '5e610702-2aae-4204-a83c-fac3f9e9ffcb', '2', '0', '2026-01-22 13:54:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000205', '2026-04-01 16:19:00-05', '2026-04-07', '2026-04-05', 'DEVUELTO', '8', '93d7e44a-222d-490c-b565-b0df0e0084b4', '2', '0', '2026-04-01 16:24:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000212', '2026-05-04 12:37:00-05', '2026-05-10', '2026-05-10', 'DEVUELTO', '8', '3195fd4d-04b0-4be5-ab34-42a06d10b1ce', '2', '0', '2026-05-04 12:42:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000226', '2026-07-04 14:08:00-05', '2026-07-10', '2026-07-07', 'DEVUELTO', '8', 'f84128cf-ebea-43c9-b59b-36bb3f302bfe', '2', '0', '2026-07-04 14:13:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000233', '2026-08-01 08:22:00-05', '2026-08-07', '2026-08-05', 'DEVUELTO', '8', 'b82e22cf-c1c3-4cec-b661-0d6f6eb4ebe6', '2', '0', '2026-08-01 08:27:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000013', '2024-02-21 10:10:00-05', '2024-03-03', '2024-02-29', 'DEVUELTO', '9', '7293ab36-043e-44ff-9e39-2a5046928d38', '2', '0', '2024-02-21 10:15:00-05', 'REGULAR', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000020', '2024-04-01 10:07:00-05', '2024-04-12', '2024-04-17', 'DEVUELTO', '9', '419cfd51-b7cc-49d0-9e72-c39656c2a269', '2', '0', '2024-04-01 10:12:00-05', 'BUENO', 'Devuelto con 5 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000034', '2024-06-10 08:21:00-05', '2024-06-21', '2024-06-20', 'DEVUELTO', '9', '091c6bbe-2f30-421a-af86-231d6fa0da36', '2', '0', '2024-06-10 08:26:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000041', '2024-07-09 12:35:00-05', '2024-07-20', '2024-07-18', 'DEVUELTO', '9', 'e23f39d5-6f94-4e1a-b364-4ab881ea4e22', '2', '0', '2024-07-09 12:40:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000055', '2024-09-01 12:22:00-05', '2024-09-12', '2024-09-12', 'DEVUELTO', '9', 'eb0a8a82-c3bb-4e8a-95b5-361503e73963', '2', '0', '2024-09-01 12:27:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000062', '2024-09-24 08:01:00-05', '2024-10-05', '2024-10-03', 'DEVUELTO', '9', 'fbf23f73-e6df-4708-9665-66cbf7f80af5', '2', '0', '2024-09-24 08:06:00-05', 'REGULAR', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000076', '2024-11-14 09:53:00-05', '2024-11-25', '2024-11-28', 'DEVUELTO', '9', '3161966c-3d39-4959-86d6-bacf75453a38', '2', '0', '2024-11-14 09:58:00-05', 'REGULAR', 'Devuelto con 3 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000083', '2024-12-09 09:10:00-05', '2024-12-20', '2024-12-20', 'DEVUELTO', '9', '0cf39221-522a-4b78-8487-926c4ab4be2b', '2', '0', '2024-12-09 09:15:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000104', '2025-03-09 16:49:00-05', '2025-03-20', '2025-03-17', 'DEVUELTO', '9', '16482725-961c-45c8-bf2e-85f298b98483', '2', '0', '2025-03-09 16:54:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000118', '2025-04-19 12:23:00-05', '2025-04-30', '2025-04-28', 'DEVUELTO', '9', '0edef5ab-f20e-4be1-91d0-7f63519e872f', '2', '0', '2025-04-19 12:28:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000125', '2025-05-11 16:01:00-05', '2025-05-22', '2025-05-23', 'DEVUELTO', '9', 'ab863557-5782-40f8-88a3-f43192e98f8a', '2', '0', '2025-05-11 16:06:00-05', 'BUENO', 'Devuelto con 1 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000139', '2025-07-01 15:21:00-05', '2025-07-12', '2025-07-11', 'DEVUELTO', '9', '8560cff4-e270-48fd-8778-6e6f15ffaa1a', '2', '0', '2025-07-01 15:26:00-05', 'REGULAR', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000146', '2025-07-22 10:00:00-05', '2025-08-02', '2025-07-31', 'DEVUELTO', '9', '9221b731-93b4-4918-aeb9-86a4e94d6bd5', '2', '0', '2025-07-22 10:05:00-05', 'BUENO', '', 'REGULAR'),
        ('5eed0000-0000-4000-8000-000000000160', '2025-10-01 10:49:00-05', '2025-10-12', '2025-10-14', 'DEVUELTO', '9', 'ebcd1803-0db3-4726-b3ad-09a8c8ecfcb3', '2', '0', '2025-10-01 10:54:00-05', 'REGULAR', 'Devuelto con 2 dia(s) de retraso.', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000167', '2025-11-06 16:50:00-05', '2025-11-17', '2025-11-16', 'DEVUELTO', '9', '3e5e2080-bf92-40c0-8f3e-a5f23c423f92', '2', '0', '2025-11-06 16:55:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000188', '2026-01-13 09:24:00-05', '2026-01-24', '2026-01-22', 'DEVUELTO', '9', '440e1aeb-0eec-4ee0-b6dc-8b53857d8cd8', '2', '0', '2026-01-13 09:29:00-05', 'REGULAR', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000202', '2026-03-14 10:54:00-05', '2026-03-25', '2026-03-25', 'DEVUELTO', '9', '5cf66d1e-6516-482c-9b7a-17a6f315a129', '2', '0', '2026-03-14 10:59:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000209', '2026-04-19 10:55:00-05', '2026-04-30', '2026-04-30', 'DEVUELTO', '9', '53bd2ee3-2cb6-45c3-a3e0-b5459d06e595', '2', '0', '2026-04-19 11:00:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000223', '2026-06-17 16:24:00-05', '2026-06-28', '2026-06-27', 'DEVUELTO', '9', 'ba0d7265-71d6-4dbe-a8af-fbb88413801f', '2', '0', '2026-06-17 16:29:00-05', 'REGULAR', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000230', '2026-07-17 16:34:00-05', '2026-07-28', '2026-07-28', 'DEVUELTO', '9', '95fabcb1-f91a-4720-9535-8bf6c18186ec', '2', '0', '2026-07-17 16:39:00-05', 'BUENO', '', 'BUENO'),
        ('5eed0000-0000-4000-8000-000000000244', '2026-09-22 09:02:00-05', '2026-10-03', '2026-10-01', 'DEVUELTO', '9', '12687558-8661-4cf2-ba47-da34026dabd8', '2', '0', '2026-09-22 09:07:00-05', 'BUENO', '', 'BUENO');
    -- Mantener la secuencia de usuarios por encima del ID maximo cargado.
    EXECUTE format('ALTER SEQUENCE %s RESTART WITH %s',
        pg_get_serial_sequence('public.users', 'id'),
        (SELECT max(id) + 1 FROM public.users));
    END IF;
END $base$;

-- 2. Escenarios de sanciones, colas y prestamos del script anterior.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.prestamos WHERE id = md5('qa-dump-20261125:prestamo:oculus_activo')::uuid) THEN
        RAISE EXCEPTION 'Los escenarios QA ya fueron cargados. No se repetiran.';
    END IF;
    IF (SELECT md5(string_agg(id::text || ':' || email, '|' ORDER BY id)) FROM public.users) IS DISTINCT FROM '1fc599938e52212c23f76dd2ec5e9efd'
       OR (SELECT md5(string_agg(id::text || ':' || codigo_inventario || ':' || ficha_recurso_id::text, '|' ORDER BY id)) FROM public.ejemplares_fisicos) IS DISTINCT FROM '56e2a69315aa5f4501015d8513aff704'
       OR (SELECT md5(string_agg(id::text || ':' || nombre, '|' ORDER BY id)) FROM public.fichas_recurso) IS DISTINCT FROM 'e11bccc1d6abb43008a9c3f39204d93e'
       OR (SELECT count(*) FROM public.prestamos) <> 264
       OR EXISTS (SELECT 1 FROM public.cola_reservas)
       OR EXISTS (SELECT 1 FROM public.users WHERE status <> 'ACTIVO' OR NOT is_active OR suspendido_hasta IS NOT NULL)
       THEN RAISE EXCEPTION 'La base no coincide con el dump original. Restaurar una copia de pruebas antes de ejecutar.';
    END IF;
    IF CURRENT_DATE < DATE '2026-11-25' THEN
        RAISE EXCEPTION 'La fecha local es anterior al dump; verificar el reloj del servidor.';
    END IF;
END $$;

-- Sincronizar las cuatro politicas del dump solamente tras validar los datos base.
-- Se conservan los UUID existentes; se insertan las politicas ausentes.
-- Los valores previos se sustituyen deliberadamente para reproducir los escenarios QA.
INSERT INTO public.politicas_prestamo (id, tipo_usuario, dias_maximo_prestamo, max_prestamos_simultaneos, dias_suspension_por_dia_retraso, dias_suspension_por_perdida) VALUES
        ('e06feaa1-a319-4819-bc6c-7cd67a327034', 'STUDENT', '6', '3', '2', '30'),
        ('ec1364ab-88fe-4560-acad-f8b3ecc53420', 'ADMINISTRATOR', '2', '3', '2', '30'),
        ('7730dfea-1a5e-4416-bdf4-02ca4939434f', 'TEACHER', '11', '3', '2', '30'),
        ('b9ef8e41-21e8-4324-bc88-b2025957fdf0', 'ADMINISTRATIVE_STAFF', '23', '10', '2', '30')
    ON CONFLICT (tipo_usuario) DO UPDATE SET
    dias_maximo_prestamo = EXCLUDED.dias_maximo_prestamo,
    max_prestamos_simultaneos = EXCLUDED.max_prestamos_simultaneos,
    dias_suspension_por_dia_retraso = EXCLUDED.dias_suspension_por_dia_retraso,
    dias_suspension_por_perdida = EXCLUDED.dias_suspension_por_perdida;

-- Confirmar los datos exactos de las politicas usadas en los escenarios.
DO $politicas$
BEGIN
    IF (SELECT count(*) FROM public.politicas_prestamo) <> 4 OR EXISTS (
        SELECT 1 FROM (VALUES
            ('STUDENT',6,3,2,30), ('TEACHER',11,3,2,30),
            ('ADMINISTRATOR',2,3,2,30), ('ADMINISTRATIVE_STAFF',23,10,2,30)
        ) AS esperado(tipo,dias,maximo,factor,perdida)
        LEFT JOIN public.politicas_prestamo p ON p.tipo_usuario = esperado.tipo
        WHERE p.id IS NULL OR (p.dias_maximo_prestamo,p.max_prestamos_simultaneos,
            p.dias_suspension_por_dia_retraso,p.dias_suspension_por_perdida)
            IS DISTINCT FROM (esperado.dias,esperado.maximo,esperado.factor,esperado.perdida)
    ) THEN RAISE EXCEPTION 'Las politicas no coinciden con los datos base; usar una copia limpia de pruebas.';
    END IF;
END $politicas$;

-- Replica el calendario laboral del sistema, sin insertar feriados inventados.
CREATE FUNCTION pg_temp.qa_dia(desde date, n integer) RETURNS date
LANGUAGE plpgsql STABLE AS $$
DECLARE d date := desde; restante integer := abs(n);
BEGIN
    WHILE restante > 0 LOOP
        d := d + CASE WHEN n < 0 THEN -1 ELSE 1 END;
        IF extract(isodow FROM d) <= 5 AND NOT EXISTS (SELECT 1 FROM public.feriados WHERE fecha = d) THEN
            restante := restante - 1;
        END IF;
    END LOOP;
    RETURN d;
END $$;

-- Normalizar estados antiguos tal como hace el backend. No borrar historial.
UPDATE public.prestamos SET estado = 'VENCIDO'
WHERE estado = 'ACTIVO' AND fecha_limite < CURRENT_DATE;
WITH caducadas AS (
    UPDATE public.prestamos SET estado = 'CANCELADO'
    WHERE estado = 'RESERVADO'
      AND pg_temp.qa_dia(fecha_prestamo::date, 1) < CURRENT_DATE
    RETURNING ejemplar_fisico_id
)
UPDATE public.ejemplares_fisicos e
SET estado = CASE WHEN e.condicion = 'DANADO' THEN 'EN_MANTENIMIENTO' ELSE 'DISPONIBLE' END
FROM caducadas c WHERE e.id = c.ejemplar_fisico_id AND e.estado = 'RESERVADO';

CREATE TEMP TABLE qa_prestamos (
    caso text PRIMARY KEY, usuario_id bigint, codigo text UNIQUE, estado text,
    dias_atras integer, renovaciones smallint, condicion_devolucion text
) ON COMMIT DROP;
INSERT INTO qa_prestamos VALUES
    ('oculus_activo', 10, 'TEC-OCU-001', 'ACTIVO', 0, 0, NULL),
    ('lenovo_atendido', 11, 'COM-LEN-001', 'RESERVADO', 0, 0, NULL),
    ('lenovo_activo_2', 12, 'COM-LEN-002', 'ACTIVO', 0, 0, NULL),
    ('lenovo_activo_3', 13, 'COM-LEN-003', 'ACTIVO', 0, 0, NULL),
    ('hp_activo', 14, 'COM-HP-001', 'ACTIVO', 0, 0, NULL),
    ('proyector_atendido', 18, 'TEC-PRY-001', 'RESERVADO', 0, 0, NULL),
    ('perdida', 41, 'TEC-CAM-003', 'PERDIDO', 3, 0, NULL),
    ('mora', 42, 'LIT-CAS-001', 'DEVUELTO', 10, 0, 'REGULAR'),
    ('mora_acumulada', 43, 'LAB-QUI-001', 'DEVUELTO', 10, 0, 'BUENO'),
    ('limite_1', 45, 'COM-TAB-001', 'ACTIVO', 0, 0, NULL),
    ('limite_2', 45, 'LAB-BAL-001', 'ACTIVO', 0, 0, NULL),
    ('limite_3', 45, 'ROB-IMP-001', 'ACTIVO', 0, 0, NULL),
    ('renovado', 46, 'DEP-AJE-001', 'ACTIVO', 3, 1, NULL),
    ('vencido', 47, 'DEP-AJE-002', 'VENCIDO', 9, 0, NULL),
    ('cancelado', 48, 'LIT-CAS-003', 'CANCELADO', 2, 0, NULL),
    ('danado', 52, 'LAB-QUI-003', 'DEVUELTO', 2, 0, 'DANADO'),
    ('devuelto_tiempo', 53, 'LIT-CAS-002', 'DEVUELTO', 2, 0, 'BUENO'),
    ('docente_activo', 57, 'TEC-PRY-002', 'ACTIVO', 0, 0, NULL),
    ('reserva_directa', 54, 'COM-TAB-002', 'RESERVADO', 0, 0, NULL);

-- Comprobar disponibilidad real y politicas antes de generar prestamos.
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM qa_prestamos q
        LEFT JOIN public.ejemplares_fisicos e ON e.codigo_inventario = q.codigo
        LEFT JOIN public.fichas_recurso f ON f.id = e.ficha_recurso_id
        LEFT JOIN public.users u ON u.id = q.usuario_id
        WHERE e.id IS NULL OR u.id IS NULL OR e.estado <> 'DISPONIBLE' OR e.condicion = 'DANADO'
        OR f.estado_ficha <> 'ACTIVA'
        OR EXISTS (SELECT 1 FROM public.prestamos p WHERE p.ejemplar_fisico_id = e.id AND p.estado IN ('ACTIVO','RESERVADO','VENCIDO')))
    THEN RAISE EXCEPTION 'Algun ejemplar o usuario seleccionado no esta disponible en la base.'; END IF;
END $$;

-- Los plazos nuevos usan las politicas del dump (incluidos los dias habiles).
WITH datos AS (
    SELECT q.*, e.id AS ejemplar_id, e.condicion AS condicion_inicial,
        COALESCE(pol.dias_maximo_prestamo, 7) AS dias_maximo,
        CASE WHEN q.dias_atras = 0 THEN now() - interval '5 minutes'
             ELSE (pg_temp.qa_dia(CURRENT_DATE, -q.dias_atras) + time '09:00')::timestamptz END AS inicio
    FROM qa_prestamos q
    JOIN public.ejemplares_fisicos e ON e.codigo_inventario = q.codigo
    JOIN public.users u ON u.id = q.usuario_id
    LEFT JOIN public.politicas_prestamo pol ON pol.tipo_usuario = u.tipo_usuario
)
INSERT INTO public.prestamos (
    id, fecha_prestamo, fecha_limite, fecha_devolucion, estado, usuario_id,
    ejemplar_fisico_id, registrado_por_id, renovaciones, fecha_entrega,
    condicion_devolucion, observaciones, condicion_entrega
)
SELECT md5('qa-dump-20261125:prestamo:' || caso)::uuid, inicio,
    CASE WHEN estado IN ('RESERVADO','CANCELADO') THEN NULL
         ELSE pg_temp.qa_dia(CASE WHEN renovaciones > 0 THEN CURRENT_DATE ELSE inicio::date END, dias_maximo) END,
    CASE WHEN estado = 'DEVUELTO' THEN CURRENT_DATE ELSE NULL END,
    estado, usuario_id, ejemplar_id,
    CASE WHEN estado IN ('RESERVADO','CANCELADO') THEN NULL ELSE 2 END,
    renovaciones,
    CASE WHEN estado IN ('RESERVADO','CANCELADO') THEN NULL ELSE inicio END,
    condicion_devolucion, '[QA dump 20261125] ' || caso,
    CASE WHEN estado IN ('RESERVADO','CANCELADO') THEN NULL ELSE condicion_inicial END
FROM datos;

UPDATE public.ejemplares_fisicos e SET
    estado = CASE q.estado WHEN 'RESERVADO' THEN 'RESERVADO'
        WHEN 'ACTIVO' THEN 'PRESTADO' WHEN 'VENCIDO' THEN 'PRESTADO'
        WHEN 'PERDIDO' THEN 'DADO_DE_BAJA'
        ELSE CASE WHEN q.condicion_devolucion = 'DANADO' THEN 'EN_MANTENIMIENTO' ELSE 'DISPONIBLE' END END,
    condicion = COALESCE(q.condicion_devolucion, e.condicion)
FROM qa_prestamos q WHERE e.codigo_inventario = q.codigo;

-- Sanciones manuales, vencidas, inclusivas y acumuladas. Las cuentas siguen activas.
UPDATE public.users SET suspendido_hasta = CASE id
    WHEN 40 THEN CURRENT_DATE + 10  -- entro a la cola antes de ser sancionado
    WHEN 43 THEN CURRENT_DATE + 10  -- sancion previa para acumular la mora
    WHEN 44 THEN CURRENT_DATE - 1   -- sancion expirada
    WHEN 50 THEN CURRENT_DATE       -- sigue vigente durante hoy
    WHEN 56 THEN CURRENT_DATE + 15  -- docente sancionado
    END
WHERE id IN (40,43,44,50,56);

-- Aplicar sanciones por devolucion tardia usando dias HABILES y el factor del usuario.
WITH mora AS (
    SELECT p.usuario_id, (SELECT count(*) FROM generate_series(p.fecha_limite + 1, p.fecha_devolucion, interval '1 day') d(fecha)
        WHERE extract(isodow FROM d.fecha) <= 5
        AND NOT EXISTS (SELECT 1 FROM public.feriados f WHERE f.fecha = d.fecha::date))::integer
        * COALESCE(pol.dias_suspension_por_dia_retraso, 2) AS dias
    FROM public.prestamos p JOIN public.users u ON u.id = p.usuario_id
    LEFT JOIN public.politicas_prestamo pol ON pol.tipo_usuario = u.tipo_usuario
    WHERE p.id IN (md5('qa-dump-20261125:prestamo:mora')::uuid,md5('qa-dump-20261125:prestamo:mora_acumulada')::uuid)
)
UPDATE public.users u SET suspendido_hasta = greatest(CURRENT_DATE, u.suspendido_hasta) + m.dias
FROM mora m WHERE u.id = m.usuario_id AND m.dias > 0;
UPDATE public.users u SET suspendido_hasta = CURRENT_DATE + COALESCE(
    (SELECT p.dias_suspension_por_perdida FROM public.politicas_prestamo p WHERE p.tipo_usuario = u.tipo_usuario),30)
WHERE u.id = 41;

CREATE TEMP TABLE qa_colas (caso text PRIMARY KEY, usuario_id bigint, codigo text, estado text, orden integer) ON COMMIT DROP;
INSERT INTO qa_colas VALUES
    ('oculus_20', 20, 'TEC-OCU-001', 'ESPERANDO', 1),
    ('oculus_21', 21, 'TEC-OCU-001', 'ESPERANDO', 2),
    ('oculus_22', 22, 'TEC-OCU-001', 'ESPERANDO', 3),
    ('oculus_23', 23, 'TEC-OCU-001', 'ESPERANDO', 4),
    ('oculus_24', 24, 'TEC-OCU-001', 'ESPERANDO', 5),
    ('oculus_25', 25, 'TEC-OCU-001', 'ESPERANDO', 6),
    ('oculus_26', 26, 'TEC-OCU-001', 'ESPERANDO', 7),
    ('oculus_27', 27, 'TEC-OCU-001', 'ESPERANDO', 8),
    ('oculus_28', 28, 'TEC-OCU-001', 'ESPERANDO', 9),
    ('oculus_29', 29, 'TEC-OCU-001', 'ESPERANDO', 10),
    ('oculus_30', 30, 'TEC-OCU-001', 'ESPERANDO', 11),
    ('oculus_31', 31, 'TEC-OCU-001', 'ESPERANDO', 12),
    ('oculus_32', 32, 'TEC-OCU-001', 'ESPERANDO', 13),
    ('oculus_33', 33, 'TEC-OCU-001', 'ESPERANDO', 14),
    ('oculus_34', 34, 'TEC-OCU-001', 'ESPERANDO', 15),
    ('oculus_35', 35, 'TEC-OCU-001', 'ESPERANDO', 16),
    ('oculus_36', 36, 'TEC-OCU-001', 'ESPERANDO', 17),
    ('oculus_37', 37, 'TEC-OCU-001', 'ESPERANDO', 18),
    ('oculus_38', 38, 'TEC-OCU-001', 'ESPERANDO', 19),
    ('oculus_39', 39, 'TEC-OCU-001', 'ESPERANDO', 20),
    ('oculus_cancelado', 17, 'TEC-OCU-001', 'CANCELADO', 0),
    ('hp_sancionado_primero', 40, 'COM-HP-001', 'ESPERANDO', 1),
    ('hp_segundo', 15, 'COM-HP-001', 'ESPERANDO', 2),
    ('hp_tercero', 16, 'COM-HP-001', 'ESPERANDO', 3),
    ('lenovo_1', 17, 'COM-LEN-001', 'ESPERANDO', 1),
    ('lenovo_2', 19, 'COM-LEN-001', 'ESPERANDO', 2),
    ('lenovo_3', 20, 'COM-LEN-001', 'ESPERANDO', 3),
    ('lenovo_atendido', 11, 'COM-LEN-001', 'ATENDIDO', 0),
    ('proyector_atendido', 18, 'TEC-PRY-001', 'ATENDIDO', 0),
    ('proyector_cancelado', 55, 'TEC-PRY-001', 'CANCELADO', 0);

-- Estados historicos y cola FIFO. UUID internos deterministas; no se agregan fichas.
INSERT INTO public.cola_reservas (id, fecha_solicitud, estado, ficha_recurso_id, usuario_id)
SELECT md5('qa-dump-20261125:cola:' || q.caso)::uuid,
    CASE WHEN q.estado = 'ATENDIDO' THEN now() - interval '20 minutes'
         WHEN q.estado = 'CANCELADO' THEN now() - interval '15 minutes'
         ELSE now() - interval '4 minutes' + q.orden * interval '1 second' END,
    q.estado, e.ficha_recurso_id, q.usuario_id
FROM qa_colas q JOIN public.ejemplares_fisicos e ON e.codigo_inventario = q.codigo;

-- Aserciones post-carga. Ante cualquier discrepancia, la transaccion se revierte.
DO $$ BEGIN
    IF (SELECT count(*) FROM public.prestamos) <> 283 OR (SELECT count(*) FROM public.cola_reservas) <> 30 THEN
        RAISE EXCEPTION 'Cantidad de escenarios inesperada.';
    END IF;
    IF EXISTS (SELECT 1 FROM public.prestamos p JOIN public.ejemplares_fisicos e ON e.id = p.ejemplar_fisico_id
        WHERE (p.estado IN ('ACTIVO','VENCIDO') AND e.estado <> 'PRESTADO') OR (p.estado = 'RESERVADO' AND e.estado <> 'RESERVADO'))
        OR EXISTS (SELECT 1 FROM public.ejemplares_fisicos e WHERE e.estado IN ('PRESTADO','RESERVADO')
            AND NOT EXISTS (SELECT 1 FROM public.prestamos p WHERE p.ejemplar_fisico_id = e.id AND p.estado IN ('ACTIVO','VENCIDO','RESERVADO')))
    THEN RAISE EXCEPTION 'Inconsistencia entre prestamos pendientes y ejemplares.'; END IF;
    IF EXISTS (SELECT 1 FROM public.cola_reservas c JOIN public.ejemplares_fisicos e ON e.ficha_recurso_id = c.ficha_recurso_id
        WHERE c.estado = 'ESPERANDO' AND e.estado = 'DISPONIBLE' AND e.condicion <> 'DANADO')
        OR EXISTS (SELECT 1 FROM public.cola_reservas c JOIN public.prestamos p ON p.usuario_id = c.usuario_id
            JOIN public.ejemplares_fisicos e ON e.id = p.ejemplar_fisico_id AND e.ficha_recurso_id = c.ficha_recurso_id
            WHERE c.estado = 'ESPERANDO' AND p.estado IN ('ACTIVO','VENCIDO','RESERVADO'))
    THEN RAISE EXCEPTION 'Cola incompatible con disponibilidad o prestamos pendientes.'; END IF;
    IF EXISTS (SELECT 1 FROM public.prestamos p JOIN qa_prestamos q ON p.id = md5('qa-dump-20261125:prestamo:' || q.caso)::uuid
        WHERE (p.estado = 'VENCIDO' AND p.fecha_limite >= CURRENT_DATE) OR (p.estado = 'ACTIVO' AND p.fecha_limite < CURRENT_DATE)
        OR (p.fecha_devolucion IS NOT NULL AND p.fecha_devolucion < p.fecha_entrega::date))
    THEN RAISE EXCEPTION 'Fechas incoherentes en los nuevos prestamos.'; END IF;
END $$;

-- Resumen de comprobacion (solo lectura). No muestra DNI, CUI ni hashes.
SELECT estado, count(*) AS prestamos FROM public.prestamos GROUP BY estado ORDER BY estado;
SELECT estado, count(*) AS ejemplares FROM public.ejemplares_fisicos GROUP BY estado ORDER BY estado;
SELECT f.nombre AS recurso, c.estado, count(*) AS solicitudes
FROM public.cola_reservas c JOIN public.fichas_recurso f ON f.id = c.ficha_recurso_id
GROUP BY f.nombre,c.estado ORDER BY f.nombre,c.estado;
SELECT id, email, tipo_usuario, status, suspendido_hasta,
    COALESCE(suspendido_hasta >= CURRENT_DATE,false) AS sancion_vigente
FROM public.users WHERE suspendido_hasta IS NOT NULL ORDER BY id;
SELECT q.caso, u.email, q.codigo, q.estado FROM qa_prestamos q JOIN public.users u ON u.id = q.usuario_id ORDER BY q.caso;
COMMIT;
