"use client";

import { useState } from "react";

// props ko ek interface dedia

interface ChatManagerProps {
  showChatModal: boolean;
  setShowChatModal: (value: boolean) => void;
  showChannelModal: boolean;
  setShowChannelModal: (value: boolean) => void;
}

// just for ui dummy text agya 

const dummyUsers = ["Minahil Fatima", "Sara", "Ahmed Raza"];
const dummyChannels = ["#team", "#project", "#design"];



export default function ChatManager({
  // destructuring 
  showChatModal,
  setShowChatModal,
  showChannelModal,
  setShowChannelModal,
}: ChatManagerProps) {

  const [selectedUser, setSelectedUser] = useState("");
  const [joinedChannels, setJoinedChannels] = useState<string[]>([]);

  const handleJoin = (channel: string) => {
    if (!joinedChannels.includes(channel)) {
      setJoinedChannels([...joinedChannels, channel]);
    }
  };

  return (
    <div className="h-0 w-0 overflow-hidden">

      {showChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center transition duration-300 ease-in-out">

          <div className="bg-mainPurple rounded-lg p-6 w-full max-w-[500px] mx-auto shadow-lg animate-fade-in">

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Start a New Chat</h2>
              <button onClick={() => setShowChatModal(false)} className="text-2xl text-white">×</button>
            </div>

            <select
              onChange={(e) => setSelectedUser(e.target.value)}
              value={selectedUser}
              className="w-full border p-2 rounded mb-4 focus:outline-none bg-[#943696] text-white"
            >
              <option value="">Select a user</option>
              {dummyUsers.map((user) => (
                <option key={user} value={user} className="text-white">
                  {user}
                </option>
              ))}
            </select>

            {selectedUser && (
              <div className="bg-[#943696] p-4 rounded">
                <p className="text-sm text-white">Chat with <b>{selectedUser}</b></p>
                <p className="text-white">Start a conversation...</p>
              </div>
            )}

          </div>

        </div>
      )}

      {showChannelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center transition duration-300 ease-in-out">

          <div className="bg-mainPurple rounded-lg p-6 w-full max-w-[500px] mx-auto shadow-lg animate-fade-in space-y-4">

            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold text-white">Join Channels</h2>
              <button onClick={() => setShowChannelModal(false)} className="text-2xl text-white">×</button>
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-white">Available Channels</h3>
              <ul className="space-y-2 text-[#a7a7a7]">
                {dummyChannels.map((channel) => (
                  <li key={channel} className="flex items-center justify-between text-sm">

                    <span>{channel}</span>

                    {joinedChannels.includes(channel) ? (
                      <span className="text-white bg-green-500 flex justify-center items-center font-medium w-[80px] rounded-md h-[30px]">Joined</span>
                    ) : (
                      <button
                        onClick={() => handleJoin(channel)}
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
