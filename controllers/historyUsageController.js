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

    // Cek akumulasi penggunaan air hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalUsageToday = await HistoryUsage.aggregate([
      {
        $match: {
          userId,
          internetOfThingId,
          createdAt: { $gte: today },
        },
      },
      { $group: { _id: null, totalUsedWater: { $sum: "$usedWater" } } },
    ]);

    let notification = null;
    console.log(totalUsageToday);
    // Hanya buat notifikasi jika:
    // 1. Ada penggunaan air hari ini
    // 2. Total penggunaan >= 500 liter
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

      // Buat notifikasi baru jika belum ada notifikasi hari ini
      if (!existingNotification) {
        notification = new Notification({
          userId,
          title: "Peringatan Penggunaan Air Berlebih!",
          message: `Penggunaan air Anda hari ini telah mencapai ${totalUsageToday[0].totalUsedWater} liter. Harap hemat air!`,
        });
        await notification.save();
      }
    }

    return res.status(201).json({
      status: 201,
      data: history,
      notification,
      message: "Riwayat penggunaan air tercatat",
    });
  } catch (error) {
    console.error("Error in createHistory:", error);
    return res.status(500).json({
      status: 500,
      message: "Terjadi kesalahan pada server",
      error: error.message,
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
            hour: {
              $dateToString: {
                format: "%H",
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
        // Untuk bulan, kita grouping berdasarkan minggu dalam bulan
        groupBy = {
          _id: {
            week: {
              $ceil: {
                $divide: [{ $dayOfMonth: "$createdAt" }, 7],
              },
            },
          },
          totalUsedWater: { $sum: "$usedWater" },
        };
        break;
      case "tahun":
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear(), 0, 1);
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
      {
        $match: {
          userId: userId,
          internetOfThingId: internetOfThingId,
          createdAt: { $gte: startDate },
        },
      },
      { $group: groupBy },
      { $sort: { _id: 1 } },
    ]);

    // Array nama hari dan bulan
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

    // Prepare full data for the response based on the filter
    let fullData = [];

    if (filter === "hari") {
      // Untuk data per jam dalam sehari
      for (let hour = 0; hour < 24; hour++) {
        const hourStr = hour.toString().padStart(2, "0");
        const hourData = histories.find((item) => item._id.hour === hourStr);
        fullData.push({
          time: `${hourStr}:00`,
          totalUsedWater: hourData ? hourData.totalUsedWater : 0,
        });
      }
    } else if (filter === "minggu") {
      // Untuk data per hari dalam seminggu
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        // MongoDB $dayOfWeek mengembalikan 1-7 (1=Minggu, 7=Sabtu)
        const dayValue = dayIndex + 1;
        const dayData = histories.find((item) => item._id.day === dayValue);
        fullData.push({
          time: days[dayIndex],
          totalUsedWater: dayData ? dayData.totalUsedWater : 0,
        });
      }
    } else if (filter === "bulan") {
      // Menghitung jumlah minggu dalam bulan ini
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const totalWeeks = Math.ceil(lastDayOfMonth.getDate() / 7);

      // Untuk data per minggu dalam sebulan
      for (let week = 1; week <= totalWeeks; week++) {
        const weekData = histories.find((item) => item._id.week === week);
        fullData.push({
          time: `Minggu ke-${week}`,
          totalUsedWater: weekData ? weekData.totalUsedWater : 0,
        });
      }
    } else if (filter === "tahun") {
      // Untuk data per bulan dalam setahun
      for (let month = 0; month < 12; month++) {
        const monthValue = month + 1; // MongoDB $month mengembalikan 1-12
        const monthData = histories.find(
          (item) => item._id.month === monthValue
        );
        fullData.push({
          time: months[month],
          totalUsedWater: monthData ? monthData.totalUsedWater : 0,
        });
      }
    }

    // Cek total penggunaan air hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalUsageToday = await HistoryUsage.aggregate([
      {
        $match: {
          userId: userId,
          internetOfThingId: internetOfThingId,
          createdAt: { $gte: today },
        },
      },
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
      data: fullData,
      notification: notification ? notification : null,
    });
  } catch (error) {
    console.error("Error in getHistories:", error);
    res.status(500).json({
      status: 500,
      message: "Terjadi kesalahan pada server",
      error: error.message,
    });
  }
};
