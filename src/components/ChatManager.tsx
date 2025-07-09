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
import { toast } from "sonner";
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
  setSelectedChannelId,
}: ChatManagerProps) {
  // ---STATES---
  const [joinedChannels, setJoinedChannels] = useState<string[]>([]);
  const [channelName, setChannelName] = useState("");
  const [channelType, setChannelType] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchUser, setSearchUser] = useState("");
  const [searchText, setSearchText] = useState("");


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

      toast("Joined channel successfully", {
        description: "You can now chat in this channel 💬",
      });
    } catch (error) {
      console.error("Error joining channel:", error);
      toast.error("Join Failed", {
        description: "Try Again",
      });
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
      setShowCreateChannelModal(false);
      toast.success("Channel Created Successfully");
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  // usi channel ko jo db me store hua ab ui pe show krwayege
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "channels"), (snapshot) => {
      const list = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          type: data.type,
          members: data.members || [],
        };
      });

      
      setChannels(list);
    });
    return () => unsub();
  }, []);

const resetCreateChannelModal = () => {
  setChannelName("");
  setChannelType("");
  setSelectedMembers([]);
  setSearchText(""); // make sure this state exists
};

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
                  Search a user to chat
                </label>

                {/* Search Input */}
                <input
                  type="text"
                  placeholder="Type a name..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="w-full p-3 bg-[#2a2a2a] border border-[#3a3a3a] text-white rounded-xl focus:outline-none focus:ring-mainPurple focus:border-transparent mb-3"
                />

                {/* Filtered User List */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {users
                    .filter((user) => {
                      const isCurrentUser = user.uid === auth.currentUser?.uid;
                      return (
                        !isCurrentUser &&
                        user.name
                          .toLowerCase()
                          .includes(searchUser.toLowerCase())
                      );
                    })
                    .map((user) => (
                      <div
                        key={user.uid}
                        onClick={() => {
                          setSelectedUserId(user.uid);
                          setSelectedChannelId("");
                          setShowChatModal(false);
                        }}
                        className="cursor-pointer p-2 bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a] transition-colors"
                      >
                        <span className="text-white">{user.name}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHANNEL MODAL */}
      {/* Join Channel Modal */}
      {showJoinChannelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
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
              {channels
              .map((channel: any) => {
                const alreadyMember = channel.members.includes(
                  auth.currentUser?.uid
                );

                // sirf un channels ko show kro jo joined nahi hain
                if (alreadyMember) return null;

                return (
                  <div
                    key={channel.id}
                    className="p-4 bg-[#2a2a2a] rounded-xl flex items-center justify-between hover:bg-[#383838] transition-all duration-300 shadow-sm"
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
                          toast("Joined channel successfully", {
                            description: "You can now chat in this channel 💬",
                          });
                        } catch (error) {
                          toast("Failed to join channel.");
                        }
                      }}
                      className="bg-mainPurple hover:bg-[#9f44a1] text-white px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 shadow-md"
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
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-mainPurple rounded-lg flex items-center justify-center">
                  <Hash size={16} className="text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white ">
                  Create Channel
                </h2>
              </div>
              <button
                 onClick={() => {
    setShowCreateChannelModal(false);
    resetCreateChannelModal();
  }}
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
                  required
                />
              </div>

              {/* Channel Type */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Channel Type
                </label>
                <div className="flex gap-4">
  {/* Public Option */}
  <div className="flex-1">
    <button
      type="button"
      onClick={() => setChannelType("public")}
      className={`w-full py-2 px-4 rounded-xl text-sm font-semibold transition-colors border ${
        channelType === "public"
          ? "bg-mainPurple text-white border-mainPurple"
          : "bg-[#1a1a1a] text-gray-300 border-[#333] hover:border-mainPurple"
      }`
    }
    >
      Public
    </button>
    <p className="text-xs text-gray-400 text-center mt-1">
      Anyone can join
    </p>
  </div>

  {/* Private Option */}
  <div className="flex-1">
    <button
      type="button"
      onClick={() => setChannelType("private")}
      className={`w-full py-2 px-4 rounded-xl text-sm font-semibold transition-colors border ${
        channelType === "private"
          ? "bg-mainPurple text-white border-mainPurple"
          : "bg-[#1a1a1a] text-gray-300 border-[#333] hover:border-mainPurple"
      }`}
    >
      Private
    </button>
    <p className="text-xs text-gray-400 text-center mt-1">
      Only selected members can join
    </p>
  </div>
</div>
</div>

              {/* Members Selection */}
             {channelType === "private" && (
  // members UI
 <div>
                
                <label className="block text-sm font-medium text-white mb-1">
                  Add Members
                </label>
                <p className="text-sm text-gray-400 mb-2">
  {selectedMembers.length} members selected
</p>
<input
  type="text"
  placeholder="Search members..."
  value={searchText}
  onChange={(e) => setSearchText(e.target.value)}
  className="w-full px-3 py-2 mb-2 rounded-custom bg-[#2a2a2a] text-white border border-[#3a3a3a] outline-none"
/>
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                  
                  {users
                   .filter(user =>
    user.name.toLowerCase().includes(searchText.toLowerCase())
  )
                  .map((user) => {
    const isSelected = selectedMembers.includes(user.uid);
    return (
      <div
        key={user.uid}
        className={`flex items-center gap-2 p-2 rounded-custom transition-colors cursor-pointer ${
          isSelected ? " bg-mainPurple" : ""
        }`}
          onClick={() => {
    if (selectedMembers.includes(user.uid)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== user.uid));
    } else {
      setSelectedMembers([...selectedMembers, user.uid]);
    }
  }}

      >

        <label htmlFor={user.uid} className="text-white text-sm">
          {user.name}
        </label>
      </div>
    );
  })}
                </div>
              </div>
             )}
            
              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                 disabled={
    !channelName ||
    !channelType ||
    (channelType === "private" && selectedMembers.length < 2)
  }
                type="submit"
                  className="bg-mainPurple hover:bg-[#7b287c] text-white px-6 py-2 rounded-lg font-medium cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

     

        {/* Available Channels */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Available Channels
          </h3>

          {channels.length === 0 ? (
            <div className="text-center py-8">
              <Hash size={48} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No channels available</p>
              <p className="text-gray-500 text-sm">
                Create the first channel above
              </p>
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
  );
}
