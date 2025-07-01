"use client";

import { useEffect, useState } from "react";
import { Headphones } from "lucide-react";
import ChatManager from "@/components/ChatManager";
import { signOut } from "firebase/auth";
import { auth } from "../../../firebase";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../firebase";
import socket from "../utils/socket";
import { getSessionId } from "../utils/getSessionId";

export default function ChatPage() {

  // ----STATES----
  const [showSidebar, setShowSidebar] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);

  const [message, setMessage] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState("");

  const router = useRouter();

  // ---- LOGOUT FUNCTION ----

  const logOut = async () => {
    await signOut(auth);
    router.push("/Login");
  };



  useEffect(() => {
    // current user jo login he woh uthana h agr login nh h to kch nh kro nh to...
    const currentUser = auth.currentUser;

    if (!currentUser || !selectedUserId) return;
    // dono users k beech ek session ID banegi

    const sessionId = getSessionId(currentUser.uid, selectedUserId);
    // time k hisab se msg fetch krne ki query
    const q = query(
      collection(db, "chats", sessionId, "messages"),
      orderBy("timestamp")
    );

    // msgs ko realtime me ui pe leke ao
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const filtered = snapshot.docs.map((doc) => doc.data());

      // sare msgs state me set
      setChatMessages(filtered);
    });

    return () => unsubscribe();
  }, [selectedUserId]);




  // fetching users from firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      // hr user ki docId or data uthana h
      const userList = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      }));

      // state update
      setUsers(userList);
    });
    return () => unsub();
  }, []);





  // ---SEND MESSAGE---
  const sendMessage = async () => {
    const currentUser = auth.currentUser;

    if (
      !currentUser ||
      !message.trim() ||
      (!selectedUserId && !selectedChannelId)
    )
      return;

    try {
      if (selectedUserId) {
        const sessionId = getSessionId(currentUser.uid, selectedUserId);

        // fire store me save
        await addDoc(collection(db, "chats", sessionId, "messages"), {
          senderId: currentUser.uid,
          receiverId: selectedUserId,
          text: message,
          timestamp: serverTimestamp(),
        });

        // dsre user ko bhejo
        socket.emit("sendMessage", {
          senderId: currentUser.uid,
          receiverId: selectedUserId,
          text: message,
          sessionId: sessionId,
        });

        // agr ksi channel me msg bhjna h
      } else if (selectedChannelId) {
        await addDoc(
          collection(db, "channels", selectedChannelId, "messages"),
          {
            senderId: currentUser.uid,
            text: message,
            timestamp: serverTimestamp(),
          }
        );
      }

      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };




  // channels msgs show krwane hen
  useEffect(() => {
    if (!selectedChannelId) return;

    const q = collection(db, "channels", selectedChannelId, "messages");

    // real time msg milrha
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => doc.data());

      // msgs set kro
      setChatMessages(msgs);
    });
    return () => unsubscribe();
  }, [selectedChannelId]);




  // ---CHANNEL SETTINGS PUBLIC PRIVATE---
  const handleChannelClick = (channel: any) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // private h or user include nh h to
    if (
      channel.type === "private" &&
      !channel.members.includes(currentUser.uid)
    ) {
      alert("You are not a member of this private channel");
      return;
    }

    // agr member h or public h to channel select hojae
    setSelectedChannelId(channel.id);
    // or direct msg wala user chat hatadi
    setSelectedUserId("");
  };





  // frontend pe socket connect
  useEffect(() => {
    // agr pehle se connect nh h to connect kro
    if (!socket.connected) {
      socket.connect();
    }
    // hojae connect to console pe id print kro
    socket.on("connect", () => {
      console.log("connected", socket.id);
    });

    // kaam hojae to off krdo
    return () => {
      socket.off("connect");
    };
  }, []);




  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // agr new msg ka event chle to check krna h ye msg dono users k andr h ye na nh
    socket.on("newMessage", (data) => {
      if (
        (data.senderId === selectedUserId &&
          data.receiverId === currentUser.uid) ||
        (data.senderId === currentUser.uid &&
          data.receiverId === selectedUserId)
      ) {
        // if yes to add krdo list me msg ki
        setChatMessages((prev) => [...prev, data]);
      }
    });

    return () => {
      socket.off("newMessage");
    };
  }, [selectedUserId]);




  return (
    <div className="h-screen flex flex-col sm:flex-row font-poppins">
      {/* ---SIDEBAR--  */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-[350px] p-4 bg-mainPurple border-r z-50 
          transform transition-transform duration-300 ease-in-out
          ${showSidebar ? "translate-x-0" : "-translate-x-full"} 
          md:relative md:translate-x-0 md:flex
        `}
      >
        <div className="p-4 flex flex-col gap-2 w-full">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Chattrix</h2>
            <button
              className="text-2xl pr-6 text-white sm:hidden"
              onClick={() => setShowSidebar(false)}
            >
              ×
            </button>
          </div>

          <button
            className="w-full flex items-center gap-2 text-sm text-white font-bold mt-4"
            onClick={() => setShowChatModal(true)}
          >
            <span className="bg-[#fec3ff] text-mainPurple rounded-md w-5 h-5 flex items-center justify-center font-bold">
              +
            </span>
            New Chat
          </button>

          <button
            className="w-full flex items-center gap-2 text-sm text-white font-bold"
            onClick={() => setShowChannelModal(true)}
          >
            <span className="bg-[#fec3ff] text-mainPurple rounded-md w-5 h-5 flex items-center justify-center font-bold">
              +
            </span>
            Join Channel
          </button>



          {/* mesaages user  */}

          <h3 className="text-sm text-grayText font-bold mt-4">
            Direct Messages
          </h3>
          <ul className="text-sm space-y-1 text-grayText cursor-pointer">
            {users.map((user) => (
              <li
                key={user.uid}
                onClick={() => {
                  setSelectedUserId(user.uid);
                  setSelectedChannelId("");
                }}
              >
                {user.name}
              </li>
            ))}
          </ul>



          {/* channels Name  */}

          <h3 className="text-sm text-grayText font-bold mt-4">Channels</h3>
          <ul className="text-sm space-y-1 text-grayText cursor-pointer">
            {channels.map((channel) => (
              <li
                key={channel.id}
                onClick={() => {
                  handleChannelClick(channel);
                  setSelectedUserId("");
                }}
              >
                #{channel.name}
              </li>
            ))}
          </ul>

          <button
            onClick={logOut}
            className=" mt-4 rounded-md w-[100px] h-[30px] font-medium text-[#4A154B] bg-[#fec3ff]"
          >
            Logout
          </button>
        </div>
      </aside>




      {/* ---CHAT AREA-- */}

      <main className="flex-1 bg-darkText flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-gray-500 bg-darkText">
          <button
            className="md:hidden text-white text-xl"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            ☰
          </button>
          <h2 className="font-bold text-gray-300 text-xl">
            {" "}
            {selectedUserId
              ? users.find((u) => u.uid === selectedUserId)?.name || "User"
              : selectedChannelId
              ? "#" +
                (channels.find((c) => c.id === selectedChannelId)?.name ||
                  "Channel")
              : "No Chat Selected"}
          </h2>

          {selectedChannelId && (
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                ...(new Set(
                  channels.find((c) => c.id === selectedChannelId)?.members ||
                    []
                ) as unknown as string[]),
              ].map((uid) => {
                const user = users.find((u) => u.uid === uid);
                if (!user) return null;
                return (
                  <span key={uid} className="text-xs text-gray-300 font-medium">
                    {user.name}
                  </span>
                );
              })}
            </div>
          )}

          <Headphones className="text-white w-6 h-6 cursor-pointer" />
        </header>



        {/*  yahan hum ChatManager component ko bhej rahe hain jisme:
 modal dikhane aur band karne ka control (chat aur channel dono)
 channels aur users ka data
selected user aur selected channel ko set karne wale functions
 sab props ke through bhej rahe hain */}

        <ChatManager
          showChatModal={showChatModal}
          setShowChatModal={setShowChatModal}
          showChannelModal={showChannelModal}
          setShowChannelModal={setShowChannelModal}
          setChannels={setChannels}
          channels={channels}
          users={users}
          setSelectedUserId={setSelectedUserId}
          setSelectedChannelId={setSelectedChannelId}
        />



        {/* --MSGS--  */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="space-y-4">
            {chatMessages.map((msg, index) => (
              <div key={index} className="space-y-1">
                <h4 className="font-bold text-white text-sm">
                  {msg.senderId === auth.currentUser?.uid
                    ? "You"
                    : users.find((u) => u.uid === msg.senderId)?.name ||
                      "Unknown"}
                </h4>
                <p className="text-white text-sm">{msg.text}</p>
              </div>
            ))}
          </div>
        </div>

        <footer className="p-4 border-t bg-[#333333] border-gray-500 flex gap-2">


          
          {/* --MSG INPUT--  */}

          <input
            type="text"
            placeholder="Type a message..."
            onChange={(e) => setMessage(e.target.value)}
            value={message}
            className="flex-1 p-2 rounded-md border bg-[#333333] border-[#333333] text-white focus:outline-none focus:border-gray-200"
          />
          <button
            onClick={sendMessage}
            className="bg-[#181818] text-white px-4 py-2 rounded-md"
          >
            Send
          </button>
        </footer>
      </main>
    </div>
  );
}
