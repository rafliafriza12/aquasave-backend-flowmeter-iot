import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        status: 400,
        message: "ID user dibutuhkan, tapi tidak tersedia",
      });
    }

    const notifications = await Notification.find({ userId });

    if (notifications.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Tidak ada notifikasi untuk pengguna ini",
      });
    }

    return res.status(200).json({
      status: 200,
      data: notifications,
      message: "Notifikasi berhasil diambil",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Terjadi kesalahan pada server",
      error: error.message,
    });
  }
};
