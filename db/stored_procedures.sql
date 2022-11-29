use proyecto_bdd;
-- EVENTO

-- Insertar evento
/*
 @param f_inicio - fecha_inicio
 @param f_fin - fecha_fin
 @param lug - lugar
*/
drop procedure if exists set_evento;
delimiter $$
create procedure set_evento(
in f_inicio date,
in f_fin date,
in lug varchar(255)
) begin
    insert into EVENTO (fecha_inicio, fecha_fin, lugar) values (f_inicio, f_fin, lug);
end $$
delimiter ;

-- Stored procedure para traer todos los eventos con fecha de fin
-- anterior a la actual.
drop procedure if exists get_events_prior_to_current_date;
delimiter $$
create procedure get_events_prior_to_current_date() begin
   select * from EVENTO where fecha_fin < curdate();
end $$
delimiter ;

-- EQUIPO

-- Insertar equipos

/*
 @param cat - La categoría del equipo
 @param inst - Institución de procedencia del equipo
*/

drop procedure if exists set_team;
delimiter $$
create procedure set_team(
    in cat enum('primaria', 'secundaria', 'bachillerato', 'profesional'),
    in inst varchar(255)
) begin

    insert into EQUIPO (categoria, institucion) values (cat, inst);

end $$
delimiter ;

-- Obtener equipo más recientemente insertado
drop procedure if exists get_last_team;
delimiter $$
create procedure get_last_team()
begin
    select cod_equipo, categoria from EQUIPO order by cod_equipo desc limit 1;
end $$
delimiter ;


-- INTEGRANTE

-- Insertar integrante
/*
 @param crp - CURP
 @param cod_e - cod_equipo
 @param nom_pila - nombre_pila
 @param p_apellido - primer_apellido
 @param s_apellido - segundo_apellido
 @param f_nac - fecha_nac
*/
drop procedure if exists set_participant;
delimiter $$
create procedure set_participant(
    in crp varchar(18),
    in cod_e int,
    in nom_pila varchar(255),
    in p_apellido varchar(255),
    in s_apellido varchar(255),
    in f_nac date
)
begin
    insert into PARTICIPANTE values (crp, cod_e, nom_pila, p_apellido, s_apellido, f_nac);
end $$
delimiter ;


-- JURADO

-- Insertar jurados
/*
 @param nom_pila - nombre_pila
 @param ape_1  - apellido_1
 @param ape_2  - apellido_2
*/
drop procedure if exists set_jurado;
delimiter $$
create procedure set_jurado(
in nom_pila varchar(255),
in ape_1 varchar(255),
in ape_2 varchar(255)
) begin
    insert into JURADO (nombre_pila, apellido_1, apellido_2) values (nom_pila, ape_1, ape_2);
end;
$$

-- PROYECTO

-- Insertar proyecto
/*
 @para nom_proyecto - nombre_proyecto
 @param cod_eq - cod_equipo
*/
drop procedure if exists set_proyecto;
delimiter $$
create procedure set_proyecto(
in nom_proyecto varchar(255),
in cod_eq int
) begin
    insert into PROYECTO (nombre_proyecto, cod_equipo) values (nom_proyecto, cod_eq);
end $$
delimiter ;

-- COLABORAR

/*
 @param jurado - id_jurado
 @param evento - cod_evento
 @param cat - categoria
*/
drop procedure if exists set_colaborar;
delimiter $$
create procedure set_colaborar(
in jurado int,
in evento int,
in cat enum('primaria', 'secundaria', 'bachillerato', 'profesional')
)begin
    insert into COLABORAR values (jurado, evento, cat);
end $$
delimiter ;

-- EVALUAR_EN

/*
 @param proyecto - cod_proyecto
 @param evento  - cod_evento
 @param jurado - id_jurado
*/

drop procedure if exists set_evaluacion;
delimiter $$
create procedure set_evaluacion(
in proyecto int,
in evento int,
in jurado int
) begin
    insert into EVALUAR_EN values (proyecto, evento, jurado);
end $$
delimiter ;

-- Traer top N de un evento en particular
drop procedure if exists get_top_teams;
delimiter $$
create procedure get_top_teams(
in evento int,
in top int
) begin
  -- Quiero mostrar los primeros N equipos en el evento tal, en concreto
  -- código de equipo, nombre, nombre proyecto, cal prog, cal diseño, cal cons, total
    select f.cod_equipo,
           f.nombre_equipo,
           nombre_proyecto,
           f.cod_evento,
           f.id_jurado,
           f.cal_total_prog,
           f.cal_total_disenno,
           f.cal_total_cons,
           (f.cal_total_prog + f.cal_total_disenno + f.cal_total_cons) as final_score
    from PROYECTO natural join(select *
    from EQUIPO natural join (
    select * from evaluar_en natural join cat_programacion
    natural join (select * from evaluar_en natural join cat_disenno) m
    natural join (select * from evaluar_en natural join cat_construccion) n where cod_evento like evento) l)f
    order by (f.cal_total_prog + f.cal_total_disenno + f.cal_total_cons) desc limit top;

end $$
delimiter ;

-- CAT_PROGRAMACION

/*
 @param proyecto - cod_proyecto
 @param evento - cod_evento
 @param cal_insp - cal_inspeccion
 @param cal_sis - cal_sistema_aut
 @param cal_demos - cal_demostracion
 @param cal_sist_man - cal_sistema_man
*/
drop procedure if exists set_cat_prog;
delimiter $$
create procedure set_cat_prog(
in proyecto int,
in evento int,
in cal_insp int,
in cal_sis int,
in cal_demos int,
in cal_sist_man int
) begin
    set @total = cal_sis + cal_sist_man + cal_insp;
    insert into CAT_PROGRAMACION values (proyecto, evento, cal_insp, cal_sis, cal_demos, cal_sist_man, @total);
end $$
delimiter ;

-- CAT_DISENNO
/*
 @param proyecto - cod_proyecto
 @param evento - cod_evento
 @param cal_bit - cal_bitacora
 @param cal_med_dig - cal_medio_dig
*/
drop procedure if exists set_cat_disenno;
delimiter $$
create procedure set_cat_disenno(
in proyecto int,
in evento int,
in cal_bit int,
in cal_med_dig int
) begin
    set @total = cal_bit + cal_med_dig;
    insert into CAT_DISENNO values (proyecto, evento, cal_bit, cal_med_dig, @total);
end $$
delimiter ;

-- CAT_CONSTRUCCION
/*
 @param proyecto - cod_proyecto
 @param evento - cod_evento
 @param cal_insp - cal_inspeccion
 @param cal_lib - cal_libreta_ing
*/
drop procedure if exists set_cat_construccion;
delimiter $$
create procedure set_cat_construccion(
in proyecto int,
in evento int,
in cal_insp int,
in cal_lib int
) begin
    set @total = cal_lib + cal_insp;
    insert into CAT_CONSTRUCCION values (proyecto, evento, cal_insp, cal_lib, @total);
end $$
delimiter ;