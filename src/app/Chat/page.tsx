"use client";

import { useEffect, useState } from "react";
import {
  Send,
  Menu,
  X,
  Plus,
  Hash,
  MessageCircle,
  Image,
  User,
  Lock,
} from "lucide-react";
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
  setDoc,
  doc,
  updateDoc,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../../../firebase";
import socket from "../utils/socket";
import { getSessionId } from "../utils/getSessionId";
import { toast } from "sonner";

export default function ChatPage() {
  // ----STATES----
  const [showSidebar, setShowSidebar] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  const [message, setMessage] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [messagesEndRef, setMessagesEndRef] = useState<HTMLDivElement | null>(
    null
  );
  const [showJoinChannelModal, setShowJoinChannelModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // agr login nh h to login page pe redirect hojaega khd
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/Login");
      }
    });

    return () => unsubscribe();
  }, []);

  // Auto scroll to bottom when new messages come
  useEffect(() => {
    if (messagesEndRef) {
      messagesEndRef.scrollTop = messagesEndRef.scrollHeight;
    }
  }, [chatMessages]);

  // ---- LOGOUT FUNCTION ----
  const logOut = async () => {
    await signOut(auth);
    router.push("/Login");
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser || !selectedUserId) return;

    setLoading(true);
    // dono users ki id mila k ek session id bnani h jis me chats store hongi dono ki
    const sessionId = getSessionId(currentUser.uid, selectedUserId);
    const q = query(
      collection(db, "chats", sessionId, "messages"),
      orderBy("timestamp")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const filtered = snapshot.docs.map((doc) => doc.data());
      setChatMessages(filtered);
      setLoading(false);
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
        await setDoc(
          doc(db, "chats", sessionId),
          { createdAt: serverTimestamp() },
          { merge: true }
        );

        // ffirestore me save
        await addDoc(collection(db, "chats", sessionId, "messages"), {
          senderId: currentUser.uid,
          receiverId: selectedUserId,
          text: message,
          timestamp: serverTimestamp(),
        });

        // dsre user ko msg send
        socket.emit("sendMessage", {
          senderId: currentUser.uid,
          receiverId: selectedUserId,
          text: message,
          sessionId: sessionId,
        });
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
    setLoading(true);

    const q = collection(db, "channels", selectedChannelId, "messages");
    orderBy("timestamp");
    // real time msg milrha
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map((doc) => doc.data())
        .filter((msg) => msg.timestamp)
        .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
      setChatMessages(msgs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [selectedChannelId]);

  // ---CHANNEL SETTINGS PUBLIC PRIVATE---
  const handleChannelClick = (channel: any) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    if (
      // private h or user include nh h to
      channel.type === "private" &&
      !channel.members.includes(currentUser.uid)
    ) {
      toast("You are not a member of this private channel");
      return;
    }

    // agr member h or public h to channel select hojae
    setSelectedChannelId(channel.id);
    setSelectedUserId("");
  };

  // frontend pe socket connect
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
    socket.on("connect", () => {
      console.log("connected", socket.id);
    });

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

  // enter press krne se msg send
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    const handleFocus = () => {
      messagesEndRef?.scrollIntoView({ behavior: "smooth" });
    };

    window.addEventListener("focusin", handleFocus);
    return () => window.removeEventListener("focusin", handleFocus);
  }, []);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser || users.length === 0) return;

    const unsub = onSnapshot(collection(db, "chats"), (snapshot) => {
      const recentIds = new Set<string>();

      snapshot.docs.forEach((doc) => {
        const sessionId = doc.id;
        if (sessionId.includes(currentUser.uid)) {
          const otherId = sessionId
            .split("_")
            .find((id) => id !== currentUser.uid);
          if (otherId) recentIds.add(otherId);
        }
      });

      const filtered = users.filter((u) => recentIds.has(u.uid));
      setRecentUsers(filtered);
    });

    return () => unsub();
  }, [users]);

  // member remove
  const removeMember = async (memberId: string) => {
    try {
      if (!selectedChannelId) return;

      const channelRef = doc(db, "channels", selectedChannelId);

      await updateDoc(channelRef, {
        members: arrayRemove(memberId),
      });
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row bg-[#0a0a0a] font-inter overflow-hidden">
      {/* ---SIDEBAR-- */}

      <aside
        className={`fixed top-0 left-0 h-full w-[280px] bg-[#1a1a1a] border-r border-[#2a2a2a] z-50 transform transition-transform duration-300 ease-in-out ${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 md:flex md:w-[280px]`}
      >
        <div className="flex flex-col h-full w-full">
          {/* Header */}

          <div className="p-4 border-b border-[#2a2a2a]">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                {/* logo  */}
                <div className="w-[50px] h-[50px]">
                  <img
                    src="/logo.png"
                    alt="Chattrix Logo"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* name  */}
                <h2 className="text-white font-semibold text-lg">Chattrix</h2>
              </div>

              <button
                className="text-white md:hidden"
                onClick={() => setShowSidebar(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* New Chat & Join Channel Buttons */}
            <div className="space-y-2">
              {/* button 1 */}
              {/* <button
                onClick={() => setShowChatModal(true)}
                className="w-full flex items-center gap-3 text-white p-2 rounded-lg transition-colors"
              >
                <div className="w-6 h-6 bg-mainPurple rounded-md flex items-center justify-center">
                  <Plus size={14} />
                </div>
                <span className="text-sm font-medium">New Chat</span>
              </button> */}

              <button
                onClick={() => setShowJoinChannelModal(true)}
                className="w-full flex items-center gap-3 text-white p-2 rounded-lg transition-colors"
              >
                <div className="w-6 h-6 bg-mainPurple rounded-md flex items-center justify-center">
                  <Hash size={14} />
                </div>
                <span className="text-sm font-medium">Browse Channel</span>
              </button>

              {/* Create Channel Button */}
              <button
                onClick={() => setShowCreateChannelModal(true)}
                className="w-full flex items-center gap-3 text-white p-2 rounded-lg transition-colors"
              >
                <div className="w-6 h-6 bg-mainPurple rounded-md flex items-center justify-center">
                  <Plus size={14} />
                </div>
                <span className="text-sm font-medium">Create Channel</span>
              </button>
            </div>
          </div>

          {/* Direct Messages */}
          <div className="flex-1 overflow-y-auto sidebar-user-scroll px-2 pt-4 pb-4">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
  <h3 className="text-gray-400 text-xs uppercase tracking-wide font-semibold">
    Direct Messages
  </h3>
  <button onClick={() => setShowChatModal(true)}>
    <Plus size={20} className="text-white" />
  </button>
</div>

              {/* users  */}
              <div className="space-y-1">
                {recentUsers.map((user) => (
                  <div
                    key={user.uid}
                    onClick={() => {
                      setSelectedUserId(user.uid);
                      setSelectedChannelId("");
                      setShowSidebar(false);
                    }}
                    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer text-gray-400"
                  >
                    {/* user ki profile pic  */}
                    <div className="w-8 h-8 bg-[#2a2a2a] rounded-full flex items-center justify-center">
                      <User className="text-white w-4 h-4" />
                    </div>

                    {/* usernames */}
                    <span className="text-sm font-medium truncate">
                      {user.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Channels */}
            <div>
              <h3 className="text-gray-400 text-xs uppercase tracking-wide font-semibold mb-3">
                Channels
              </h3>
              {/* channels k name  */}
              <div className="space-y-1">
                {channels
                 .filter((channel) => channel.members.includes(auth.currentUser?.uid))
                .map((channel) => (
                  <div
                    key={channel.id}
                    onClick={() => {
                      handleChannelClick(channel);
                      setShowSidebar(false);
                    }}
                    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer text-gray-400"
                  >
                    {channel.type === "private" ? (
                      <Lock size={16} className="text-gray-500" />
                    ) : (
                      <Hash size={16} className="text-gray-400" />
                    )}

                    <span className="text-sm font-medium truncate">
                      {channel.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="p-4 border-t border-[#2a2a2a]">
            <button
              onClick={logOut}
              className="w-full bg-mainPurple hover:bg-[#7b287c] text-white py-2 px-4 rounded-xl text-md tracking-wide font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* ---CHAT AREA-- */}
      <main className="flex-1 bg-[#0a0a0a] flex flex-col h-full w-full md:w-auto">
        {/* Header */}
        <header className="flex items-center justify-between p-3 md:p-4 border-b border-[#2a2a2a] bg-[#1a1a1a] flex-shrink-0">
          {/* mob k lye menu button  */}
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-white"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <Menu size={20} />
            </button>

            <div className="flex items-center gap-3">
              {selectedUserId ? (
                <>
                  <div className="w-8 h-8 bg-mainPurple rounded-full flex items-center justify-center">
                    <User className="text-white w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold text-sm md:text-base">
                      {users.find((u) => u.uid === selectedUserId)?.name ||
                        "User"}
                    </h2>
                  </div>
                </>
              ) : selectedChannelId ? (
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    {channels.find((c) => c.id === selectedChannelId)?.type ===
                    "private" ? (
                      <Lock size={16} className="text-gray-400" />
                    ) : (
                      <Hash size={16} className="text-gray-400" />
                    )}

                    <h2 className="text-white font-semibold text-sm md:text-base">
                      {channels.find((c) => c.id === selectedChannelId)?.name ||
                        "Channel"}
                    </h2>
                  </div>

                  <p
                    className="text-gray-400 text-xs cursor-pointer"
                    onClick={() => setShowMembersModal(true)}
                  >
                    View Members
                  </p>
                </div>
              ) : (
                <div>
                  <h2 className="text-white font-semibold text-sm md:text-base">
                    No Chat Selected
                  </h2>
                </div>
              )}
              {showMembersModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 ">
                  <div className="bg-[#1a1a1a] w-full max-w-md mx-auto rounded-lg p-6 shadow-xl text-white">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold">Channel Members</h2>
                      <button
                        onClick={() => setShowMembersModal(false)}
                        className="text-gray-400 hover:text-white text-sm"
                      >
                        Close
                      </button>
                    </div>

                    {/* channel members  */}
                   {selectedChannelId && (
  <div className="mt-4">
    <h3 className="text-white text-sm font-semibold mb-2">Channel Members</h3>
    <div className="max-h-60 overflow-y-auto space-y-3">
      <ul>
        {channels
          .find((c) => c.id === selectedChannelId)
          ?.members?.map((memberId: string, index: number) => {
            const user = users.find((u) => u.uid === memberId);
            if (!user) return null;

            return (
              <li
                key={index}
                className="flex items-center justify-between bg-[#2a2a2a] px-3 py-2 rounded-md"
              >
                <div
                  className="flex items-center gap-3 cursor-pointer hover:underline"
                  onClick={() => {
                    setSelectedUserId(user.uid);
                    setSelectedChannelId(""); 
                    setShowJoinChannelModal(false); 
                    setShowMembersModal(false)
                  }}
                >
                  <span className="text-sm">{user.name}</span>
                </div>

                <button
                  onClick={() => removeMember(memberId)}
                  className="text-red-400 text-xs font-semibold hover:underline"
                >
                  Remove
                </button>
              </li>
            );
          })}
      </ul>
    </div>
  </div>
)}

                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/*  yahan hum ChatManager component ko bhej rahe hain jisme:
//  modal dikhane aur band karne ka control (chat aur channel dono)
//  channels aur users ka data
// selected user aur selected channel ko set karne wale functions
//  sab props ke through bhej rahe hain */}
        <ChatManager
          showChatModal={showChatModal}
          setShowChatModal={setShowChatModal}
          showJoinChannelModal={showJoinChannelModal}
          setShowJoinChannelModal={setShowJoinChannelModal}
          showCreateChannelModal={showCreateChannelModal}
          setShowCreateChannelModal={setShowCreateChannelModal}
          setChannels={setChannels}
          channels={channels}
          users={users}
          setSelectedUserId={setSelectedUserId}
          setSelectedChannelId={setSelectedChannelId}
        />

        {/* Messages */}
        <div
          ref={setMessagesEndRef}
          className="flex-1 overflow-y-auto scrollbar-hide p-3 md:p-4 min-h-0 flex flex-col"
        >
          {loading ? (
            <div className="flex items-center justify-center flex-1">
              <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : chatMessages.length === 0 ? (
            <div className="flex items-center justify-center flex-1">
              <div className="text-center">
                <MessageCircle
                  size={48}
                  className="text-gray-600 mx-auto mb-4"
                />
                <p className="text-gray-400 text-lg font-medium">
                  No messages yet
                </p>
                <p className="text-gray-500 text-sm">
                  Send a message to start the conversation
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-4 mt-auto">
              {chatMessages.map((msg, index) => {
                const isCurrentUser = msg.senderId === auth.currentUser?.uid;
                const senderName = isCurrentUser
                  ? "You"
                  : users.find((u) => u.uid === msg.senderId)?.name ||
                    "Unknown";

                return (
                  <div
                    key={index}
                    className={`flex ${
                      isCurrentUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] md:max-w-[70%] ${
                        isCurrentUser ? "order-2" : "order-1"
                      }`}
                    >
                      {!isCurrentUser && (
                        <div className="flex items-center gap-2 mb-1 ml-2">
                          <span className="text-gray-400 text-xs font-medium">
                            {senderName}
                          </span>
                        </div>
                      )}
                      <div
                        className={`p-3 rounded-2xl ${
                          isCurrentUser
                            ? "bg-mainPurple text-white rounded-br-md"
                            : "bg-[#2a2a2a] text-gray-100 rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Message Input */}
        {(selectedUserId || selectedChannelId) && (
          <footer className="p-3 md:p-4 border-t border-[#2a2a2a] bg-[#1a1a1a] flex-shrink-0 safe-bottom">
            <div className="flex items-end gap-2 md:gap-3 flex-nowrap w-full">
              <div className="flex-1 relative">
                <div className="flex items-center bg-[#2a2a2a] rounded-2xl p-2 md:p-3 flex-1 min-w-0">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none text-sm"
                  />

                  <div className="flex items-center ml-2">
                    <button className="text-gray-400 hover:text-white transition-colors p-1">
                      <Image size={16} className="md:w-[18px] md:h-[18px]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* send msg buttom  */}
              <button
                onClick={sendMessage}
                className="bg-mainPurple text-white p-2 md:p-3 rounded-xl transition-all flex-shrink-0"
              >
                <Send size={16} className="md:w-[18px] md:h-[18px]" />
              </button>
            </div>
          </footer>
        )}
      </main>
    </div>
  );
}
