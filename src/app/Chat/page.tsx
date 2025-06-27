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

export default function ChatPage() {
  
  const [showSidebar, setShowSidebar] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);

  const [message, setMessage] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  const router = useRouter();

  const logOut = async () => {
    await signOut(auth);
    router.push("/Login");
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser || !selectedUserId) return;

    const q = query(collection(db, "messages"), orderBy("timestamp"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const filtered = snapshot.docs
        .map((doc) => doc.data())
        .filter(
          (msg) =>
            (msg.senderId === currentUser.uid &&
              msg.receiverId === selectedUserId) ||
            (msg.senderId === selectedUserId &&
              msg.receiverId === currentUser.uid)
        );

      setChatMessages(filtered);
    });

    return () => unsubscribe();
  }, [selectedUserId]);

  // fetching users from firestore

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const userList = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      }));
      setUsers(userList);
    });
    return () => unsub();
  }, []);

  const sendMessage = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser || !message.trim() || !selectedUserId) return;

    try {
      await addDoc(collection(db, "messages"), {
        senderId: currentUser.uid,
        receiverId: selectedUserId,
        text: message,
        timestamp: serverTimestamp(),
      });

      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="h-screen flex flex-col sm:flex-row font-poppins">
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

          <h3 className="text-sm text-grayText font-bold mt-4">
            Direct Messages
          </h3>
          <ul className="text-sm space-y-1 text-grayText cursor-pointer">
            {users.map((user) => (
              <li key={user.uid} onClick={() => setSelectedUserId(user.uid)}>
                {user.name}
              </li>
            ))}
          </ul>

          <h3 className="text-sm text-grayText font-bold mt-4">Channels</h3>
          <ul className="text-sm space-y-1 text-grayText cursor-pointer">
            <li>#Team</li>
            <li>#Project</li>
          </ul>

          <button
            onClick={logOut}
            className=" mt-4 rounded-md w-[100px] h-[30px] font-medium text-[#4A154B] bg-[#fec3ff]"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-darkText flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-gray-500 bg-darkText">
          <button
            className="md:hidden text-white text-xl"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            ☰
          </button>
          <h2 className="font-bold text-gray-300 text-xl">Sara</h2>
          <Headphones className="text-white w-6 h-6 cursor-pointer" />
        </header>

        <ChatManager
          showChatModal={showChatModal}
          setShowChatModal={setShowChatModal}
          showChannelModal={showChannelModal}
          setShowChannelModal={setShowChannelModal}
        />

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="space-y-4">
            {chatMessages.map((msg, index) => (
              <div key={index} className="space-y-1">
                <h4 className="font-bold text-white text-sm">
                  {msg.senderId === auth.currentUser?.uid ? "You" : "Them"}
                </h4>
                <p className="text-white text-sm">{msg.text}</p>
              </div>
            ))}
          </div>
        </div>

        <footer className="p-4 border-t bg-[#333333] border-gray-500 flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            onChange={(e) => setMessage(e.target.value)}
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
