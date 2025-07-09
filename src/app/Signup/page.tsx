"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../../../firebase";
import { useRouter } from "next/navigation";
import { setDoc, doc } from "firebase/firestore";
import Image from "next/image";
import { db } from "../../../firebase";

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
const [username, setUsername] = useState("");

  const router = useRouter();


const signUp = async () => {
  try {
    setLoading(true);
    const userData = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );


    const autoUserName = fullName || email.split("@")[0];
    console.log(autoUserName);
    

    await updateProfile(userData.user, {
      displayName: autoUserName,
    });

    await setDoc(doc(db, "users", userData.user.uid), {
      uid: userData.user.uid,
      name: autoUserName,
      email: email,
    });

    router.push("/Chat");
  } catch (error: any) {
    if (error.code === "auth/email-already-in-use") {
      alert("Already in use, redirecting to login....");
      router.push("/Login");
    } else {
      alert(error.message);
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex flex-col lg:flex-row items-center justify-evenly min-h-screen bg-lightBg p-10">
      <div className="hidden lg:block">
        <Image
          src="/illustration.png"
          alt="Signup Illustration"
          width={400}
          height={400}
        />
      </div>

      {/* form  */}
      <div className="flex flex-col items-center gap-4 relative bottom-10">
        <Image src="/logo.png" alt="Chattrix Logo" width={100} height={100} />

        <h1 className="text-black font-poppins font-extrabold text-xl sm:text-2xl -mt-6">
          Chattrix
        </h1>

        <h2 className="font-poppins font-extrabold text-2xl text-center text-darkText sm:text-3xl xl:text-4xl">
          Create an account
        </h2>

       {step === 1 && (
  <>
    <input
      type="email"
      placeholder="name@work-email.com"
      onChange={(e) => setEmail(e.target.value)}
      className="p-4 border border-grayText w-[250px] h-[40px] sm:w-[300px] sm:h-[40px] rounded-custom focus:outline-none focus:border-2 focus:border-slackBlue"
    />

    <input
      type="password"
      placeholder="password"
      onChange={(e) => setPassword(e.target.value)}
      className="p-4 border border-grayText w-[250px] h-[40px] sm:w-[300px] sm:h-[40px] rounded-custom focus:outline-none focus:border-2 focus:border-slackBlue"
    />

    <button
      onClick={() => setStep(2)}
      className="font-bold text-poppins bg-mainPurple text-white lg:w-[200px] w-[180px] text-sm hover:bg-[#6a226b] transition duration-200 h-[40px] sm:h-[40px] rounded-full"
    >
      Next
    </button>
  </>
)}


        {step === 2 && (
  <>
    <input
      type="text"
      placeholder="Choose a username (optional)"
      onChange={(e) => setFullName(e.target.value)}
      className="p-4 border border-grayText w-[250px] h-[40px] sm:w-[300px] sm:h-[40px] rounded-custom focus:outline-none focus:border-2 focus:border-slackBlue"
    />

    <p className="text-xs text-gray-500 -mt-2">
      This name will be shown in the app. Leave blank to auto-generate.
    </p>

    <button
      onClick={signUp}
      disabled={loading}
      className="font-bold text-poppins bg-mainPurple text-white lg:w-[200px] w-[180px] text-sm hover:bg-[#6a226b] transition duration-200 h-[40px] sm:h-[40px] rounded-full"
    >
      {loading ? (
        <div className="flex items-center gap-2 justify-center">
          <div className="border-2 border-white border-t-transparent animate-spin rounded-full w-4 h-4" />
          <span>Signing up...</span>
        </div>
      ) : (
        "Sign Up With Email"
      )}
    </button>
  </>
)}

      </div>
    </div>
  );
}
