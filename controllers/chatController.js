// Fetch all chats for the logged-in user
router.get("/chats", authMiddleware, async (req, res) => {
  const userId = req.user._id;

  const chats = await Message.aggregate([
    {
      $match: {
        $or: [{ senderId: userId }, { receiverId: userId }],
      },
    },
    {
      $group: {
        _id: "$chatId",
        lastMessage: { $last: "$$ROOT" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "lastMessage.receiverId",
        foreignField: "_id",
        as: "receiver",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "lastMessage.senderId",
        foreignField: "_id",
        as: "sender",
      },
    },
  ]);

  res.json({ chats });
});
