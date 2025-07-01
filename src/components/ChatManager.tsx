"use client";

import React, { useEffect, useState } from "react";
import {
  addDoc,
  serverTimestamp,
  collection,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../../firebase";

// props ko ek interface dedia like types dedi take sb clear rhe

interface ChatManagerProps {
  showChatModal: boolean;
  setShowChatModal: (value: boolean) => void;
  showChannelModal: boolean;
  setShowChannelModal: (value: boolean) => void;
  setChannels: (channels: any[]) => void;
  channels: any;
  users: any[];
  setSelectedUserId: (id: string) => void;
  setSelectedChannelId: (id: string) => void;
}

// just for ui dummy text agya

// const dummyUsers = [
//   { uid: "user1", name: "Minahil Fatima" },
//   { uid: "user2", name: "Sara" },
//   { uid: "user3", name: "Ahmed Raza" },
// ];
// const dummyChannels = ["#team", "#project", "#design"];

export default function ChatManager({
  // destructuring
  showChatModal,
  setShowChatModal,
  showChannelModal,
  setShowChannelModal,
  setChannels,
  channels,
  users,
   setSelectedUserId,     
  setSelectedChannelId
}: ChatManagerProps) {




  // ---STATES--- 

  // const [selectedUser, setSelectedUser] = useState("");
  const [joinedChannels, setJoinedChannels] = useState<string[]>([]);
  const [channelName, setChannelName] = useState("");
  const [channelType, setChannelType] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  // const [channels, setChannels] =  useState<any[]>([])





const handleJoin = async (channelId: string) => {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  try {
     //  specific channel ka reference liya jisme join karna hai
    const channelRef = doc(db, "channels", channelId);
    const channelSnap = await getDoc(channelRef);

    if (!channelSnap.exists()) return;

    // channel ka data nikal liya 
    const data = channelSnap.data();

    // Members array nikala jisme sab users jo channel me hain listed hain
    const currentMembers = data.members || [];

    if (currentMembers.includes(currentUser.uid)) return;

     //  Agar user member nahi hai to uska UID members list me add kardo
    await updateDoc(channelRef, {
      members: [...currentMembers, currentUser.uid],
    });

    setSelectedChannelId(channelId);
    setSelectedUserId("");

    alert("Joined channel successfully");

  } catch (error) {
    console.error("Error joining channel:", error);
    alert("Join failed");
  }
};




  // channel create krne ka form ki logic
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();

    const currentUser = auth.currentUser;
    if (!currentUser || !channelName || !channelType) return;

    // database me store krhe hen
    try {
      await addDoc(collection(db, "channels"), {
        name: channelName,
        type: channelType,
        admin: currentUser.uid,
        members: [currentUser.uid, ...selectedMembers],
        createdAt: serverTimestamp(),
      });

      setChannelName(""),
        setChannelType(""),
        setShowChannelModal(false),
        alert("Channel created successfully");
    } catch (error) {
      alert("Something went wrong");
    }
  };




  // usi channel ko jo db me store hua ab ui pe show krwayege

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "channels"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setChannels(list);
    });
    return () => unsub();
  }, []);



  return (
    <div className="h-0 w-0 overflow-hidden">
      {showChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center transition duration-300 ease-in-out">
          <div className="bg-mainPurple rounded-lg p-6 w-full max-w-[500px] mx-auto shadow-lg animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">
                Start a New Chat
              </h2>
              <button
                onClick={() => setShowChatModal(false)}
                className="text-2xl text-white"
              >
                ×
              </button>
            </div>

            <select
              onChange={(e) => {
                const uid = e.target.value;
                if (!uid) return;
                setSelectedUserId(uid);
                setShowChatModal(false); 
                setSelectedChannelId("");
              }}
              className="w-full border p-2 rounded mb-4 focus:outline-none bg-[#943696] text-white"
            >
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user.uid} value={user.uid} className="text-white">
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}



      {showChannelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center transition duration-300 ease-in-out">
          <div className="bg-mainPurple rounded-lg p-6 w-full max-w-[500px] mx-auto shadow-lg animate-fade-in space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold text-white">Create Channels</h2>
              <button
                onClick={() => setShowChannelModal(false)}
                className="text-2xl text-white"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateChannel} className="space-y-4">
              <input
                type="text"
                placeholder="Channel Name"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="w-full p-2 rounded bg-[#943696] text-white"
              />

              <select
                value={channelType}
                onChange={(e) => setChannelType(e.target.value)}
                className="w-full p-2 rounded bg-[#943696] text-white"
              >
                <option value="">Select Channel Type</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>

              {/* Show checkboxes only if private selected */}
              {channelType === "private" && (
                <div className="space-y-1">
                  <h4 className="text-white font-bold">Select Members:</h4>
                  {users.map((user) => (
                    <label
                      key={user.uid}
                      className="flex items-center gap-2 text-white text-sm"
                    >
                      <input
                        type="checkbox"
                        value={user.uid}
                        checked={selectedMembers.includes(user.uid)}
                        onChange={() => {
                          if (selectedMembers.includes(user.uid)) {
                            setSelectedMembers(
                              selectedMembers.filter((id) => id !== user.uid)
                            );
                          } else {
                            setSelectedMembers([...selectedMembers, user.uid]);
                          }
                        }}
                      />
                      {user.name}
                    </label>
                  ))}
                </div>
              )}

              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded w-full"
              >
                Create Channel
              </button>
            </form>

            {/* channels show krna  */}

            <div>
              <h3 className="font-semibold mb-2 text-white">
                Available Channels
              </h3>
              <ul className="space-y-2 text-[#a7a7a7]">
                {channels.map((channel: any) => (
                  <li
                    key={channel.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{channel.name}</span>

                    {joinedChannels.includes(channel.id) ? (
                      <span className="text-white bg-green-500 flex justify-center items-center font-medium w-[80px] rounded-md h-[30px]">
                        Joined
                      </span>
                    ) : (
                      <button
                        onClick={() => handleJoin(channel.id)}
                        className="text-white w-[80px] rounded-md h-[30px] bg-green-800 hover:underline"
                      >
                        Join
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
