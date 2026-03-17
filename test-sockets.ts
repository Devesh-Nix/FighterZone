import { io } from "socket.io-client";

const socket1 = io("http://localhost:5000", { transports: ["websocket"] });
const socket2 = io("http://localhost:5000", { transports: ["websocket"] });

let roomId = "";

socket1.on("connect", () => {
    console.log("S1 connected");
    socket1.emit("create-room", (res: any) => {
        console.log("Room created", res);
        roomId = res.roomId;
        
        socket2.emit("join-room", roomId, (res2: any) => {
            console.log("S2 joined", res2);
            socket1.emit("player-ready", { roomId, characterId: 0 });
            socket2.emit("player-ready", { roomId, characterId: 1 });
        });
    });
});

socket1.on("game-start", (data: any) => {
    console.log("S1 game start", data.players.length);
    process.exit(0);
});
