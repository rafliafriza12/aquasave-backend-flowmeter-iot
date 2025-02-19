import Subscribe from "../models/Subscribe.js";

export const increamentWaterUsage = async (req, res) => {
  try {
    const { subscribeId } = req.params;
    const { usedWater } = req.body;

    if (!subscribeId) {
      return res.status(400).json({
        status: 400,
        message: "subscribe id is required, but not provide",
      });
    }
    if (!usedWater) {
      return res.status(400).json({
        status: 400,
        message: "used water is required, but not provide",
      });
    }

    const subscribe = await Subscribe.findById(subscribeId);

    if (!subscribe) {
      return res.status(404).json({
        status: 404,
        message: "subscribe not found",
      });
    }

    const realUsedWater = usedWater - subscribe.totalUsedWater;

    subscribe.totalUsedWater += realUsedWater;
    await subscribe.save();

    return res.status(200).json({
      status: 200,
      data: subscribe,
      message: "Water increment running successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
};

export const createSubscribe = async (req, res) => {
  try {
    const { subscribtionName } = req.body;

    if (!subscribtionName) {
      return res.status(400).json({
        status: 400,
        message: "subscribtion name is required, but not provide",
      });
    }

    const newSubscribtion = new Subscribe({
      subscribtionName: subscribtionName,
    });

    await newSubscribtion.save();

    return res.status(201).json({
      status: 201,
      data: newSubscribtion,
      message: "new subscribtion created",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "internal server error",
    });
  }
};
