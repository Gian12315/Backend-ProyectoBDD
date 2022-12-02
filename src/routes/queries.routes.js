import {Router} from "express"
import * as query from "./queries.js"
import * as script from "./scripts.js"
const router = Router()
var session

router.get("/query/greets", (req, res) => res.send("hola"));

router.get("/query/events", async function (req, res) {
  res.send(await query.events());
});

router.get("/query/judge", async function (req, res) {
  res.send(await query.getJudge());
});

router.get("/query/judge_event", async (req, res) => {
  res.send(await query.judge_event());
});

router.get("/query/team_event", async (req, res) => {
  res.send(await query.team_event());
});

router.post("/query/login", async function (req, res) {
  const user = req.body.codigo;
  const pass = req.body.contraseña;

  console.log(req.body);

  const result = await query.login("'" + user + "'", "'" + pass + "'");
  const result_code = result[0]["@userType"];

  session = req.session;

  if (result_code == 2) {
    session.userid = "cordi";
    req.flash("info", "Se ha iniciado sesión con exito");
    req.flash("type", "success");
  } else if (result_code == 1) {
    const res = await query.get_jury_code("'" + user + "'");
    session.userid = res[0]["curp"];
    req.flash("info", "Se ha iniciado sesión con exito");
    req.flash("type", "success");
  } else {
    console.log("No existe ningun usuario");
    req.flash("info", "No existe ningun usuario.");
    req.flash("type", "error");
  }

  console.log(session);

  res.redirect("/dashboard");
});

router.get("/query/evaluations", async function (req, res) {
  console.log(req.query);
  const evento = req.query.evento;
  const cat = req.query.categoria_evento;

  res.send(await query.evaluations(evento, cat));
});

router.get("/query/get_jury_cat_teams", async function (req, res) {
  console.log(req.query);
  res.send(await query.get_jury_cat_teams(req.query.userid));
});

router.post("/query/set_team", (req, res) => {
  const data = req.body;

  const name = data.nombre_equipo;
  const cat = data.categoria_equipo;
  const inst = data.institucion_equipo;
  const part = [
    {
      CURP: data.curp_integrante1,
      nombre_pila: data.nombre_integrante1,
      apellido_1: data.apellido1_integrante1,
      apellido_2: data.apellido2_integrante1,
      fecha_nac: data.edad_integrante1,
    },
    {
      CURP: data.curp_integrante2,
      nombre_pila: data.nombre_integrante2,
      apellido_1: data.apellido1_integrante2,
      apellido_2: data.apellido2_integrante2,
      fecha_nac: data.edad_integrante2,
    },
    {
      CURP: data.curp_integrante3,
      nombre_pila: data.nombre_integrante3,
      apellido_1: data.apellido1_integrante3,
      apellido_2: data.apellido2_integrante3,
      fecha_nac: data.edad_integrante3,
    },
  ];

  let validator = 0;
  let rejectedPart = [];

  for (let i = 0; i < 3; i++) {
    let age = script.calculateAge(part[i].fecha_nac);
    if (script.validateAge(age, cat)) {
      validator++;
      rejectedPart.push(part[i]);
    }
  }

  if (validator == 3) {
    query.putTeam(name, cat, inst, part);
    req.flash("info", "Se ha registrado el equipo con exito");
    req.flash("type", "success");
  } else {
    req.flash("info", "Participante ${rejectedPart} inválido");
    req.flash("type", "error");
  }

  res.redirect("/dashboard/coordinador/registro_equipo");
});

router.post("/query/set_event", async function (req, res) {
  const data = req.body;

  const event = {
    nombre: data.nombre_evento,
    f_inicio: data.inicio_evento,
    f_fin: data.fin_evento,
    lug: data.ubicacion_sede,
  };

  console.log(event);
  const response = await query.putEvent(event);

  req.flash("info", response);
  if (response == "Evento insertado exitosamente!") {
    req.flash("type", "success");
  } else {
    req.flash("type", "error");
  }
  res.redirect("/dashboard/coordinador/registro_evento");
});

router.post("/query/assign_judge", (req, res) => {
  const data = req.body;

  const assign = {
    evento: data.evento_colaborar,
    jurado: data.jurado_colaborar,
    categoria: data.categoria_jurado,
  };

  query.assignJudge(assign);

  req.flash("info", "Se ha asigando con exito");
  req.flash("type", "success");
  res.redirect("/dashboard/coordinador/asignar_jurado");
});

router.post("/query/assign_team", async (req, res) => {
  const data = req.body;

  const assign = {
    nombre: data.proyecto_participar,
    evento: data.evento_participar,
    equipo: data.equipo_participar,
  };

  const message = await query.assignTeam(assign);
  req.flash("info", message);
  if(message == "Se ha asigando con exito"){
	req.flash("type", "success");
  }else{
	req.flash("type", "error");
  }
  res.redirect("/dashboard/coordinador/asignar_equipo");
});

router.post("/query/set_calif", (req, res) => {
  const data = req.body;

  const catpro = {
    equipo: data.equipo_eva,
    evento: data.evento_eva,
    sub1: data.inspeccion_catpro,
    sub2: data.sisauto_catpro,
    sub3: data.demo_catpro,
    sub4: data.sisman_catpro,
  };

  const catdis = {
    equipo: data.equipo_eva,
    evento: data.evento_eva,
    sub1: data.bitacora_catdis,
    sub2: data.medio_catdis,
  };

  const catcons = {
    equipo: data.equipo_eva,
    evento: data.evento_eva,
    sub1: data.inspec_catcons,
    sub2: data.libreta_catcons,
  };

  query.putCalif(catpro, catdis, catcons, req.session.userid);
  req.flash("info", "Se ha calificado con exito");
  req.flash("type", "success");
  res.redirect("/dashboard/jurado/evaluar_equipo");
});

router.post("/query/set_judge", (req, res) => {
  const data = req.body;
  let curp = data.curp;
  let nomPila = data.nom_pila;
  let primerApellido = data.apellido_1;
  let segundoApellido = data.apellido_2;
  let user = data.user;
  let password = data.password;

  query.putJudge(
    curp,
    nomPila,
    primerApellido,
    segundoApellido,
    user,
    password
  );
  req.flash("info", "Se ha creado el nuevo jurado correctamente");
  req.flash("type", "success");
  res.redirect("/dashboard/coordinador/registro_jurado");
});

router.get('/query/get_team_by_id', async function (req, res) {
	const id =  req.id
	res.send(await query.getTeamById(id))
})

router.get('/query/get_team_by_name', async function (req, res) {
	const name =  req.name
	res.send(await query.getTeamByName(name))
})

router.get('/query/get_part_of_team', async function (req, res) {
	const id =  req.id
	res.send(await query.getPartOfTeam(id))
})

router.get('/query/get_all_teams', async function (req, res){
	res.send(await query.getTeams())
})

router.delete('/query/delete_team', async function (req, res) {
	await query.deleteTeam()
	res.flash('Equipo borrado exitosamente')
	res.redirect(/* Dirección donde se borran equipos va aca */)
})

export default router
