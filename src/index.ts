import express from "express";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import jwt from "jsonwebtoken";

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(express.json());

const JWT_SECRET = "clave_secreta_prueba_atom";

// Habilita CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers",
    "Content-Type, Authorization, Origin, X-Requested-With");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

app.get("/", (req, res) => {
  res.send("¡Bienvenido al backend de Express en Cloud Functions!");
});

// Obtener usuario y generar JWT
app.get("/users/:email", async (req, res) => {
  const {email} = req.params;
  try {
    const userSnapshot = await db
      .collection("users")
      .where("email", "==", email)
      .get();

    if (userSnapshot.empty) {
      return res.status(404).json({error: "Usuario no encontrado"});
    }

    const userData = userSnapshot.docs[0].data();
    const token = jwt.sign(
      {email: userData.email},
      JWT_SECRET,
      {expiresIn: "1h"}
    );
    return res.json({token});
  } catch (error) {
    console.error("Error al buscar usuario:", error);
    return res.status(500).json({error: "Error al buscar usuario"});
  }
});

// Crear un nuevo usuario
app.post("/users", async (req, res) => {
  const {email} = req.body;

  if (!email) {
    return res.status(400).send({error: "Faltan datos"});
  }

  try {
    const newUser = {email};

    await db.collection("users").add(newUser);

    return res.status(201).send({message: "Usuario creado con éxito"});
  } catch (error) {
    return res.status(500).send({error: "Error al crear usuario"});
  }
});

// Middleware para autenticar con JWT
const authenticate = (req: any, res: any, next: () => void) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).send({error: "Token no proporcionado"});
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.locals.user = decoded;
    next();
  } catch (error) {
    res.status(401).send({error: "Token inválido o expirado"});
  }
};

// Obtener lista de todas las tareas
app.get("/tasks", authenticate, async (req, res) => {
  try {
    const tasksSnapshot = await db
      .collection("tasks")
      .orderBy("creationDateTime", "desc")
      .get();
    const tasks = tasksSnapshot.docs.map((doc) => (
      {id: doc.id, ...doc.data()}
    ));

    return res.send(tasks);
  } catch (error) {
    return res.status(500).send({error: "Error al obtener tareas"});
  }
});

// Obtener lista de todas las tareas
app.get("/tasks/:email", authenticate, async (req, res) => {
  try {
    const {email} = req.params;
    const tasksSnapshot = await db
      .collection("tasks")
      .where("email", "==", email)
      .orderBy("creationDateTime", "desc")
      .get();

    const tasks = tasksSnapshot.docs.map((doc) => (
      {id: doc.id, ...doc.data()}
    ));

    return res.send(tasks);
  } catch (error) {
    console.error("Error al obtener tareas: ", error);
    return res.status(500).send({error: "Error al obtener tareas"});
  }
});

// Agregar una nueva tarea
app.post("/tasks", authenticate, async (req, res) => {
  const {email, title, description, status} = req.body;

  if (!email || !title || !description || status === undefined) {
    return res.status(400).send({error: "Faltan datos"});
  }

  try {
    const creationDateTime = new Date();
    const newTask = {email, title, description, status, creationDateTime};
    await db.collection("tasks").add(newTask);

    return res.status(201).send({message: "Tarea creada con éxito"});
  } catch (error) {
    return res.status(500).send({error: "Error al crear tarea"});
  }
});

// Actualizar datos de una tarea existente
app.put("/tasks/:taskId", authenticate, async (req, res) => {
  const {taskId} = req.params;
  const {title, description, status} = req.body;

  try {
    const taskRef = db.collection("tasks").doc(taskId);
    const task = await taskRef.get();

    if (!task.exists) {
      return res.status(404).send({error: "Tarea no encontrada"});
    }

    const updateDateTime = new Date();
    const updateTask = {title, description, status, updateDateTime};

    await taskRef.update(updateTask);
    return res.send({message: "Tarea actualizada con éxito"});
  } catch (error) {
    return res.status(500).send({error: "Error al actualizar tarea"});
  }
});

// Eliminar una tarea existente
app.delete("/tasks/:taskId", authenticate, async (req, res) => {
  const {taskId} = req.params;

  try {
    const taskRef = db.collection("tasks").doc(taskId);
    const task = await taskRef.get();

    if (!task.exists) {
      return res.status(404).send({error: "Tarea no encontrada"});
    }

    await taskRef.delete();
    return res.send({message: "Tarea eliminada con éxito"});
  } catch (error) {
    return res.status(500).send({error: "Error al eliminar tarea"});
  }
});

exports.apiTask = functions.https.onRequest(app);
