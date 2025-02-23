import InternetOfThingTool from "../models/InternetOfThingTool.js";

export const toolRegister = async (req, res) => {
  try {
    const { userId, toolName } = req.body;
    if (!userId) {
      return res.status(400).json({
        status: 400,
        message: "ID Pengguna dibutuhkan, tapi tidak tersedia",
      });
    }
    if (!toolName) {
      return res.status(400).json({
        status: 400,
        message: "Nama sensor dibutuhkan, tapi tidak tersedia",
      });
    }

    const newTool = new InternetOfThingTool({
      userId,
      toolName,
    });

    await newTool.save();

    return res.status(201).json({
      status: 201,
      data: newTool,
      message: "Sensor berhasil didaftarkan",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Terjadi kesalahan pada server",
    });
  }
};

export const getToolsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        status: 400,
        message: "ID Pengguna dibutuhkan, tapi tidak tersedia",
      });
    }

    const tools = await InternetOfThingTool.find({ userId });

    if (tools.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Tidak ada sensor yang terdaftar",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Sensor ditemukan",
      data: tools,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Terjadi kesalahan pada server",
    });
  }
};
