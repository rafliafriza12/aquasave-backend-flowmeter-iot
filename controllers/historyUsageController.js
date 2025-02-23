import HistoryUsage from "../models/HistoryUsage.js";
import InternetOfThingTool from "../models/InternetOfThingTool.js";
import Notification from "../models/Notification.js";
import mongoose from "mongoose";

const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const months = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const createHistory = async (req, res) => {
  try {
    const { userId, internetOfThingId } = req.params;
    const { usedWater } = req.body;

    if (!userId || !internetOfThingId) {
      return res.status(400).json({
        status: 400,
        message: "ID user dan ID sensor dibutuhkan, tetapi tidak tersedia",
      });
    }

    if (!usedWater) {
      return res.status(400).json({
        status: 400,
        message: "Tidak ada air yang digunakan",
      });
    }

    const sensorTool = await InternetOfThingTool.findOne({
      userId,
      _id: new mongoose.Types.ObjectId(internetOfThingId),
    });

    if (!sensorTool) {
      return res.status(404).json({
        status: 404,
        message: "Sensor tidak ditemukan",
      });
    }

    const history = new HistoryUsage({
      userId,
      internetOfThingId,
      usedWater,
    });

    sensorTool.totalUsedWater += usedWater;

    await sensorTool.save();
    await history.save();

    return res.status(201).json({
      status: 201,
      data: history,
      message: "Riwayat penggunaan air tercatat",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Terjadi kesalahan pada server",
    });
  }
};

export const getHistories = async (req, res) => {
  try {
    const filter = req.query.filter ?? "hari";
    const { userId, internetOfThingId } = req.params;

    if (!userId || !internetOfThingId) {
      return res.status(400).json({
        status: 400,
        message: "ID user dan ID sensor dibutuhkan, tetapi tidak tersedia",
      });
    }

    let startDate;
    const now = new Date();
    let groupBy;

    switch (filter) {
      case "hari":
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        groupBy = {
          _id: {
            time: {
              $dateToString: {
                format: "%H:00",
                date: "$createdAt",
                timezone: "Asia/Jakarta",
              },
            },
          },
          totalUsedWater: { $sum: "$usedWater" },
        };
        break;
      case "minggu":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - startDate.getDay());
        startDate.setHours(0, 0, 0, 0);
        groupBy = {
          _id: { day: { $dayOfWeek: "$createdAt" } },
          totalUsedWater: { $sum: "$usedWater" },
        };
        break;
      case "bulan":
        startDate = new Date();
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        groupBy = {
          _id: { week: { $week: "$createdAt" } },
          totalUsedWater: { $sum: "$usedWater" },
        };
        break;
      case "tahun":
        startDate = new Date();
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        groupBy = {
          _id: { month: { $month: "$createdAt" } },
          totalUsedWater: { $sum: "$usedWater" },
        };
        break;
      default:
        return res.status(400).json({
          status: 400,
          message:
            "Filter tidak valid. Gunakan 'hari', 'minggu', 'bulan', atau 'tahun'",
        });
    }

    // Eksekusi query history
    const histories = await HistoryUsage.aggregate([
      { $match: { userId, internetOfThingId, createdAt: { $gte: startDate } } },
      { $group: groupBy },
      { $sort: { _id: 1 } },
    ]);

    // Mapping hasil
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    const mappedHistories = histories.map((item) => {
      if (filter === "minggu") {
        return { ...item, _id: { day: days[item._id.day - 1] } };
      }
      if (filter === "tahun") {
        return { ...item, _id: { month: months[item._id.month - 1] } };
      }
      return item;
    });

    // Cek total penggunaan air hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalUsageToday = await HistoryUsage.aggregate([
      { $match: { userId, internetOfThingId, createdAt: { $gte: today } } },
      { $group: { _id: null, totalUsedWater: { $sum: "$usedWater" } } },
    ]);

    let notification = null;
    if (
      totalUsageToday.length > 0 &&
      totalUsageToday[0].totalUsedWater >= 500
    ) {
      // Cek apakah notifikasi sudah dibuat hari ini
      const existingNotification = await Notification.findOne({
        userId,
        title: "Peringatan Penggunaan Air Berlebih!",
        createdAt: { $gte: today },
      });

      if (!existingNotification) {
        notification = new Notification({
          userId,
          title: "Peringatan Penggunaan Air Berlebih!",
          message: `Penggunaan air Anda hari ini telah mencapai ${totalUsageToday[0].totalUsedWater} liter. Harap hemat air!`,
        });
        await notification.save();
      }
    }

    // Kirim respons hanya sekali
    res.status(200).json({
      status: 200,
      filter,
      data: mappedHistories,
      notification: notification ? notification : null,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Terjadi kesalahan pada server",
      error: error.message,
    });
  }
};
