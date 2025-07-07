import express from "express"
import http from "http"
import { Server } from "socket.io"


// app bnai 
const app = express()  
// wrap kia 
const server  = http.createServer(app)
// socket.io ka server banaya or cors allow kiya star mtlb sare orogin se access allow he
const io = new Server(server, {
    cors: {
        origin: "*"
    }
})


// jab bhi koi user socket se connect hota hai
io.on("connection", (socket:any) => {
    console.log("User connected", socket.id);

    // jb user msg send kre to dsre user ko msg chla jaye 
    socket.on("sendMessage", (data:any) => {
        socket.broadcast.emit("newMessage", data)
    })

    // agr user disconnect hojae to console me print krdo 
    socket.on("disconnect", () => {
  console.log("User disconnected", socket.id);
});


})

server.listen(5000, () => {
  console.log("🔥 Server is running on port 5000");
});
