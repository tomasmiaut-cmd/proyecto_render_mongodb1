require("dotenv").config();

const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI no está configurada");
  process.exit(1);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const client = new MongoClient(MONGODB_URI);

let usuarios;

async function conectarMongoDB() {
  await client.connect();

  const db = client.db("render_demo");
  usuarios = db.collection("usuarios");

  await db.command({ ping: 1 });

  console.log("MongoDB conectado correctamente");
}

// Obtener usuarios
app.get("/api/usuarios", async (req, res) => {
  try {
    const resultado = await usuarios
      .find()
      .sort({ creadoEn: -1 })
      .toArray();

    res.json(resultado);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Error obteniendo usuarios"
    });
  }
});

// Crear usuario
app.post("/api/usuarios", async (req, res) => {
  try {
    const { nombre, email } = req.body;

    if (!nombre || !email) {
      return res.status(400).json({
        error: "Nombre y email son obligatorios"
      });
    }

    const nuevoUsuario = {
      nombre,
      email,
      creadoEn: new Date()
    };

    const resultado = await usuarios.insertOne(nuevoUsuario);

    res.status(201).json({
      mensaje: "Usuario registrado",
      id: resultado.insertedId
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Error registrando usuario"
    });
  }
});

// Eliminar usuario
app.delete("/api/usuarios/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "ID inválido"
      });
    }

    await usuarios.deleteOne({
      _id: new ObjectId(id)
    });

    res.json({
      mensaje: "Usuario eliminado"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Error eliminando usuario"
    });
  }
});

async function iniciarServidor() {
  try {
    await conectarMongoDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Servidor ejecutándose en puerto ${PORT}`);
    });
  } catch (error) {
    console.error("No se pudo iniciar la aplicación:", error);
    process.exit(1);
  }
}

iniciarServidor();