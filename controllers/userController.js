import User from "../models/User.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({
        status: 400,
        message: "Isi semua kolom input",
      });
    }

    const isAlreadyRegistered = await User.findOne({ email });
    if (isAlreadyRegistered) {
      return res.status(400).json({
        status: 400,
        message: "Email ini sudah terdaftar, silahkan menggunakan email lain",
      });
    }

    const newUser = new User({
      fullName,
      email,
    });

    bcryptjs.hash(password, 10, async (err, hash) => {
      if (err) {
        return res.status(500).json({
          status: 500,
          message: err.message,
        });
      }

      newUser.set("password", hash);
      await newUser.save();

      return res.status(201).json({
        status: 201,
        data: newUser,
        message: "Akun berhasil didaftarkan",
      });
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Terjadi kesalahan pada server",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 400,
        message: "Semua kolom harus terisi",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "Akun pengguna tidak ditemukan",
      });
    }

    const validateUser = await bcryptjs.compare(password, user.password);

    if (!validateUser) {
      return res.status(400).json({
        status: 400,
        message: "Email atau password salah",
      });
    }

    const payload = {
      userId: user._id,
      email: user.email,
    };

    const JWT_SECRET = process.env.JWT_SECRET;

    jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" }, (err, token) => {
      if (err) {
        return res.status(500).json(err);
      }
      user.set("token", token);
      user.save();
      return res.status(200).json({
        status: 200,
        data: user,
        token: user.token,
        message: "Proses login berhasil",
      });
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Terjad kesalahan pada server",
    });
  }
};

export const logout = async (req, res) => {
  try {
    const { userId } = req.params; // Anggap bahwa userId dikirim dari client saat logout

    if (!userId) {
      return res
        .status(400)
        .json({ status: 400, message: "User ID is required to logout." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: 404, message: "Akun tidak ditemukan." });
    }

    // Hapus atau atur token menjadi null
    user.set("token", null);
    await user.save();

    return res
      .status(200)
      .json({ status: 200, message: "Pengguna berhasil logout." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: 500, message: "Terjadi kesalahan pada server." });
  }
};
