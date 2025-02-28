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

    // Check if totalUsedWater is a multiple of 500
    if (sensorTool.totalUsedWater % 500 === 0) {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      // Check if a notification for today already exists
      const existingNotification = await Notification.findOne({
        userId,
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      });

      if (!existingNotification) {
        const notification = new Notification({
          userId,
          title: "Peringatan Penggunaan Air Berlebih!",
          message: `Total penggunaan air anda hari ini telah mencapai 500 liter.`,
        });
        await notification.save();
      }
    }

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
          _id: { month: { $month: "$createdAt" } },
          totalUsedWater: { $sum: "$usedWater" },
        };
        break;
      case "tahun":
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
        groupBy = {
          _id: { year: { $year: "$createdAt" } },
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
      if (filter === "bulan") {
        return { ...item, _id: { month: months[item._id.month - 1] } };
      }
      if (filter === "tahun") {
        return { ...item, _id: { year: item._id.year } };
      }
      return item;
    });

    // Prepare full data for the response based on the filter
    let fullData = [];
    if (filter === "hari") {
      for (let hour = 0; hour < 24; hour++) {
        const hourData = mappedHistories.find(
          (item) => item._id.time === `${hour}:00`
        );
        fullData.push({
          time: `${hour}:00`,
          totalUsedWater: hourData ? hourData.totalUsedWater : 0,
        });
      }
    } else if (filter === "minggu") {
      for (let day = 1; day <= 7; day++) {
        const dayData = mappedHistories.find((item) => item._id.day === day);
        fullData.push({
          time: days[day - 1],
          totalUsedWater: dayData ? dayData.totalUsedWater : 0,
        });
      }
    } else if (filter === "bulan") {
      for (let month = 1; month <= 12; month++) {
        const monthData = mappedHistories.find(
          (item) => item._id.month === month
        );
        fullData.push({
          time: months[month - 1],
          totalUsedWater: monthData ? monthData.totalUsedWater : 0,
        });
      }
    } else if (filter === "tahun") {
      for (
        let year = now.getFullYear();
        year >= now.getFullYear() - 5;
        year--
      ) {
        const yearData = mappedHistories.find((item) => item._id.year === year);
        fullData.push({
          time: year,
          totalUsedWater: yearData ? yearData.totalUsedWater : 0,
        });
      }
    }

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
      data: fullData,
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
