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
import { X, Hash, MessageCircle, Users, Lock } from "lucide-react";

// props ko ek interface dedia like types dedi take sb clear rhe
interface ChatManagerProps {
  showChatModal: boolean;
  setShowChatModal: (value: boolean) => void;

// new upgration 
  showJoinChannelModal: boolean;
  setShowJoinChannelModal: (value: boolean) => void;

  showCreateChannelModal: boolean;
  setShowCreateChannelModal: (value: boolean) => void;

  setChannels: (channels: any[]) => void;
  channels: any;
  users: any[];
  setSelectedUserId: (id: string) => void;
  setSelectedChannelId: (id: string) => void;
}


export default function ChatManager({
  // destructuring
  showChatModal,
  setShowChatModal,
  showJoinChannelModal,
  setShowJoinChannelModal,
  showCreateChannelModal,
  setShowCreateChannelModal,
  setChannels,
  channels,
  users,
  setSelectedUserId,
  setSelectedChannelId
}: ChatManagerProps) {


  // ---STATES--- 
  const [joinedChannels, setJoinedChannels] = useState<string[]>([]);
  const [channelName, setChannelName] = useState("");
  const [channelType, setChannelType] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

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

      setChannelName("");
      setChannelType("");
      setSelectedMembers([]);
      setShowCreateChannelModal(false)
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
      {/* NEW CHAT MODAL */}
      {showChatModal && (
        // background 
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
{/* new chat khulne ka div  */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-md ">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-mainPurple rounded-lg flex items-center justify-center">
                  <MessageCircle size={16} className="text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  Start New Chat
                </h2>
              </div>
              <button
                onClick={() => setShowChatModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">
                  Select a user to chat
                </label>

                <select
                  onChange={(e) => {
                    const uid = e.target.value;
                    if (!uid) return;
                    setSelectedUserId(uid);
                    setShowChatModal(false);
                    setSelectedChannelId("");
                  }}
                  className="w-full p-3 bg-[#2a2a2a] border border-[#3a3a3a] text-white rounded-xl focus:outline-none  focus:ring-mainPurple focus:border-transparent"
                >
                  <option value="" className="bg-[#2a2a2a]">
                    Choose a user...
                  </option>

                  {/* list me sb user ajayege */}
{users.map((user) => {
  const isCurrentUser = user.uid === auth.currentUser?.uid;

  return (
    <option
      key={user.uid}
      value={user.uid}
      className="bg-[#2a2a2a] text-white"
    >
      {isCurrentUser ? "You" : user.name}
    </option>
  );
})}
                
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHANNEL MODAL */}
    {/* Join Channel Modal */}
{showJoinChannelModal && (
  <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">

      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-mainPurple rounded-lg flex items-center justify-center">
            <Hash size={16} className="text-white" />
          </div>

          <h2 className="text-xl font-semibold text-white">
            Join Channel
          </h2>
        </div>
        <button
          onClick={() => setShowJoinChannelModal(false)}
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          <X size={20} />
        </button>
      </div>

      {/* Channel List */}
      <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
        {channels.map((channel: any) => {
          const alreadyMember = channel.members.includes(auth.currentUser?.uid);

          // sirf un channels ko show kro jo joined nahi hain
          if (alreadyMember) return null;

          return (
            <div
              key={channel.id}
              className="p-4 bg-[#2a2a2a] rounded-xl flex items-center justify-between"
            >
              <div>
             <h3 className="text-white font-semibold text-base flex items-center gap-2">
  {channel.type === "private" ? (
    <>
      <Lock size={14} className="text-gray-500" />
      {channel.name}
    </>
  ) : (
    <>
      <Hash size={14} className="text-gray-400" />
      {channel.name}
    </>
  )}
</h3>

              </div>

              <button
                onClick={async () => {
                  const currentUser = auth.currentUser;
                  if (!currentUser) return;

              
                  try {
                    // update Firestore me members array
                    const docRef = doc(db, "channels", channel.id);
                    await updateDoc(docRef, {
                      members: [...channel.members, currentUser.uid],
                    });

                    setShowJoinChannelModal(false);
                    alert("Successfully joined the channel!");
                  } catch (error) {
                    alert("Failed to join channel.");
                  }
                }}
                className="bg-mainPurple text-white px-4 py-2 rounded-lg text-sm"
              >
                Join
              </button>
            </div>
          );
        })}
      </div>
    </div>
  </div>
)}

{/* Create Channel Modal */}
{showCreateChannelModal && (
  <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
      
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-mainPurple rounded-lg flex items-center justify-center">
            <Hash size={16} className="text-white" />
          </div>
          <h2 className="text-xl font-semibold text-white">Create Channel</h2>
        </div>
        <button
          onClick={() => setShowCreateChannelModal(false)}
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          <X size={20} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleCreateChannel} className="p-6 space-y-4">
        {/* Channel Name */}
        <div>
          <label className="block text-sm font-medium text-white mb-1">
            Channel Name
          </label>
          <input
            type="text"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-[#2a2a2a] text-white outline-none"
            placeholder="Enter channel name"
          />
        </div>

        {/* Channel Type */}
        <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-300">
      Channel Type
    </label>
    <div className="flex gap-4">
      <button
        type="button"
        onClick={() => setChannelType("public")}
        className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-colors border ${
          channelType === "public"
            ? "bg-mainPurple text-white border-mainPurple"
            : "bg-[#1a1a1a] text-gray-300 border-[#333] hover:border-mainPurple"
        }`}
      >
        Public
      </button>
      <button
        type="button"
        onClick={() => setChannelType("private")}
        className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-colors border ${
          channelType === "private"
            ? "bg-mainPurple text-white border-mainPurple"
            : "bg-[#1a1a1a] text-gray-300 border-[#333] hover:border-mainPurple"
        }`}
      >
        Private
      </button>
    </div>
  </div>

        {/* Members Selection */}
        <div>
          <label className="block text-sm font-medium text-white mb-1">
            Add Members
          </label>
          <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
            {users.map((user) => (
              <div key={user.uid} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={user.uid}
                  checked={selectedMembers.includes(user.uid)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedMembers([...selectedMembers, user.uid]);
                    } else {
                      setSelectedMembers(
                        selectedMembers.filter((id) => id !== user.uid)
                      );
                    }
                  }}
                />
                <label htmlFor={user.uid} className="text-white text-sm">
                  {user.name}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="bg-mainPurple hover:bg-[#7b287c] text-white px-6 py-2 rounded-lg font-medium"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  </div>
)}


{/* form */}
            <div className="overflow-y-auto max-h-[70vh]">
              {/* Create Channel Form */}
              <div className="p-6 border-b border-[#2a2a2a]">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Create New Channel
                </h3>
                
                <form onSubmit={handleCreateChannel} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Channel Name
                    </label>
                    <input
                      type="text"
                      placeholder="General"
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      className="w-full p-3 bg-[#2a2a2a] border border-[#3a3a3a] text-white rounded-xl focus:outline-none focus:border-transparent placeholder-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Channel Type
                    </label>

                    <select
                      value={channelType}
                      onChange={(e) => setChannelType(e.target.value)}
                      className="w-full p-3 bg-[#2a2a2a] border border-[#3a3a3a] text-white rounded-xl focus:outline-none  focus:border-transparent"
                    >
                      <option value="" className="bg-[#2a2a2a]">
                        Select channel type...
                      </option>
                      <option value="public" className="bg-[#2a2a2a]">
                        Public
                      </option>
                      <option value="private" className="bg-[#2a2a2a]">
                        Private
                      </option>
                    </select>
                  </div>

                  {/* Members Selection for Private Channels */}
                  {channelType === "private" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        <Users size={16} className="inline mr-2" />
                        Select Members
                      </label>

                      <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-4 max-h-32 overflow-y-auto">
                        <div className="space-y-2">

                          {users.map((user) => (
                            <label
                              key={user.uid}
                              className="flex items-center gap-3 p-2 hover:bg-[#3a3a3a] rounded-lg cursor-pointer transition-colors"
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
                                className="w-4 h-4 text-mainPurple bg-[#3a3a3a] border-[#4a4a4a] rounded"
                              />
                              <span className="text-gray-300 text-sm">
                                {user.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-mainPurple hover:bg-[#7b287c] disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    Create Channel
                  </button>
                </form>
              </div>

              {/* Available Channels */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Available Channels
                </h3>
                
                {channels.length === 0 ? (
                  <div className="text-center py-8">
                    <Hash size={48} className="text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No channels available</p>
                    <p className="text-gray-500 text-sm">Create the first channel above</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {channels.map((channel: any) => (
                      <div
                        key={channel.id}
                        className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-xl hover:bg-[#3a3a3a] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="text-white font-medium">
                              # {channel.name}
                            </span>
                            <p className="text-xs text-gray-400">
                              {channel.type === "private" ? "Private" : "Public"}{" "}
                              {channel.members?.length || 0} members
                            </p>
                          </div>
                        </div>

                      
                          <button
                            onClick={() => handleJoin(channel.id)}
                            className="bg-mainPurple hover:bg-[#7b287c] text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                          >
                            Join
                          </button>
                        
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
      )}
