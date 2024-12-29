//const { response } = require("express");
const { Server } = require("socket.io");
require("dotenv").config();

const io = new Server({
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],    
    credentials: true,            
  },
});
const port = process.env.PORT || 8000;

let onlineUsers = [];

io.on("connection", (socket) => {
  console.log("new connection", socket.id);

  socket.on("user_online", (userId) => {
    const isUserAlreadyOnline = onlineUsers.some(
      (user) => user.userId === userId
    );

    if (!isUserAlreadyOnline) {
      onlineUsers.push({ userId, socketId: socket.id });
      io.emit("user_online_status", onlineUsers);
    }
  });

  socket.on("sendMessage", (res) => {
    const { recipients, message } = res;

    recipients.forEach((recipient) => {
      const recipientSocket = onlineUsers?.find(
        (user) => user.userId === recipient.userId
      );
      if (recipientSocket) {
        console.log(message.chat_id);

        io.to(recipientSocket.socketId).emit("receiveMessage", message);
      }
    });
  });

  socket.on("reactMessage", (res) => {
    const { recipients, message } = res;
    recipients.forEach((recipient) => {
      const recipientSocket = onlineUsers?.find(
        (user) => user.userId === recipient.userId
      );
      if (recipientSocket) {
        io.to(recipientSocket.socketId).emit("receiveReact", message);
      }
    });
  });

  socket.on("readMessage", ({ message, recipients }) => {
    recipients?.forEach((recipient) => {
      const recipientSocket = onlineUsers?.find(
        (user) => user.userId === recipient.userId
      );
      if (recipientSocket) {
        io.to(recipientSocket.socketId).emit("receiveRead", message);
      }
    });
  });

  socket.on("removeMessage",({message, recipients}) => {
    recipients?.forEach((recipient) => {
      const recipientSocket = onlineUsers?.find(
        (user) => user.userId === recipient.userId
      );
      if (recipientSocket) {
        io.to(recipientSocket.socketId).emit("receiveRemove", message);
      }
    });
  });

  socket.on("createGroup", ({chat, recipient}) => {
    console.log("recipients", recipient);
    console.log("online user", onlineUsers);
    
    recipient?.forEach((recipientId) => {
      const recipientSocket = onlineUsers?.find(
        (user) => user.userId == recipientId
      );
      console.log("recipient", recipientSocket);
      
      if (recipientSocket) {
        io.to(recipientSocket.socketId).emit("groupCreated", chat);
      }
    })
  });

  socket.on("deleteGroup", ({chat, recipient}) => {
    console.log("recipients", recipient);
    recipient?.forEach((recipientId) => {
      const recipientSocket = onlineUsers?.find(
        (user) => user.userId == recipientId.userId
      );
      
      if (recipientSocket) {
        io.to(recipientSocket.socketId).emit("groupDeleted", chat);
      }
    }) 
  });

  socket.on("kickGroup", ({chat,kickedUser, recipient}) => {
    recipient?.forEach((recipientId) => {
      const recipientSocket = onlineUsers?.find(
        (user) => user.userId == recipientId.userId
      );
      
      if (recipientSocket) {
        io.to(recipientSocket.socketId).emit("groupKicked", {chat, kickedUser});
      }
    })
  });

  socket.on("joinGroup", ({chat, recipient, userId}) => {
    recipient?.forEach((recipientId) => {
      const recipientSocket = onlineUsers?.find(
        (user) => user.userId == recipientId
      );
      
      if (recipientSocket) {
        io.to(recipientSocket.socketId).emit("groupJoined", {chat, userId});
      }
    })
  });

  socket.on("leaveGroup", ({chatId, userId, recipient}) => {
    recipient?.forEach((recipientId) => {
      const recipientSocket = onlineUsers?.find(
        (user) => user.userId == recipientId.userId
      );
      
      if (recipientSocket) {
        io.to(recipientSocket.socketId).emit("groupLeft", {chatId, userId});
      }
    })
  });

  socket.on("typing", ({user,chatId, recipient}) => {
    recipient?.forEach((recipientId) => {
      const recipientSocket = onlineUsers?.find(
        (user) => user.userId == recipientId
      );
      
      if (recipientSocket) {
        io.to(recipientSocket.socketId).emit("receiveTyping", {chatId,user});
      }
    })
  });

  socket.on("stopTyping", ({user,chatId, recipient}) =>{
    recipient?.forEach((recipientId) => {
      const recipientSocket = onlineUsers?.find(
        (user) => user.userId == recipientId
      );
      
      if (recipientSocket) {
        io.to(recipientSocket.socketId).emit("receiveStopTyping", {user, chatId});
      }
    })
  });

  socket.on("micOff", ({user, recipient}) => {
    const recipientSocket = onlineUsers?.find(user => user.userId == recipient);
    
    if (recipientSocket) {
      io.to(recipientSocket.socketId).emit("receiveMicOff", user);
    }
  });

  socket.on("micOn", ({user, recipient}) => {
    const recipientSocket = onlineUsers?.find(user => user.userId == recipient);
    
    if (recipientSocket) {
      io.to(recipientSocket.socketId).emit("receiveMicOn", user);
    }
  });
  socket.on("cameraOff", ({user, recipient}) => {
    const recipientSocket = onlineUsers?.find(user => user.userId == recipient);
    
    if (recipientSocket) {
      io.to(recipientSocket.socketId).emit("receiveCameraOff", user);
    }
  });

  socket.on("cameraOn", ({user, recipient}) => {
    const recipientSocket = onlineUsers?.find(user => user.userId == recipient);
    
    if (recipientSocket) {
      io.to(recipientSocket.socketId).emit("receiveCameraOn", user);
    }
  });

  socket.on("sendFriendRequest", ({userId, notify}) => {
    const recipientSocket = onlineUsers?.find(user => user?.userId == userId)
    console.log("recipientSocket", onlineUsers, userId, recipientSocket);
    
    if (recipientSocket) {
      io.to(recipientSocket.socketId).emit("receiveFriendRequest", notify);
    }
  });
  socket.on("acceptFriendRequest", ({userId, notify}) => {
    const recipientSocket = onlineUsers?.find(user => user.userId == userId)
    if (recipientSocket) {
      io.to(recipientSocket.socketId).emit("receiveFriendAccept", notify);
    }
  })
  socket.on("rejectFriendRequest", ({userId, notify}) => {
    const recipientSocket = onlineUsers?.find(user => user.userId == userId)

    if (recipientSocket) {
      io.to(recipientSocket.socketId).emit("receiveFriendReject", notify);
    }
  });



  socket.on("disconnect", () => {
    const disconnectedUser = onlineUsers.find(
      (user) => user.socketId === socket.id
    );
    if (disconnectedUser) {
      onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
      io.emit("user_online_status", onlineUsers);
    }
  });
});

io.listen(port);
