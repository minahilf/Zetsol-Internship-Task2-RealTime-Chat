'use client'
import Link from "next/link";
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../firebase";
import { useRouter } from "next/navigation"; 

export default function Login() {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const Login = async () => {
    try{
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/Chat')
      
    } catch(error:any){
      alert(error.message)
    }
  }


  return (
    <div className="bg-lightBg flex flex-col items-center justify-center min-h-screen p-10 gap-4">
      <h1 className="text-black font-poppins font-extrabold text-xl sm:text-2xl">
        Chattrix
      </h1>

      <h2 className="font-poppins font-extrabold text-3xl text-center text-darkText sm:text-4xl xl:text-5xl">
        Enter your email to log in
      </h2>

      <input
        type="email"
        placeholder="name@work-email.com"
        onChange={(e) => setEmail(e.target.value)}
        className="p-4 border border-grayText w-[250px] h-[40px] sm:w-[300px] sm:h-[40px] rounded-lg focus:outline-none focus:border-2 focus:border-slackBlue"
      />

      <input
        type="password"
        placeholder="password"
        onChange={(e) => setPassword(e.target.value)}
        className="p-4 border border-grayText w-[250px] h-[40px] sm:w-[300px] sm:h-[40px] rounded-lg focus:outline-none focus:border-2 focus:border-slackBlue"
      />

      <button onClick={Login} className="font-bold text-poppins bg-mainPurple text-white w-[250px] h-[40px] sm:w-[300px] sm:h-[40px] rounded-lg">
        Log In With Email
      </button>

      <p className="text-sm font-poppins font-light mt-4 text-center">
        OR New To Chattrix?{" "}
        <Link href="/Signup" className="text-blue-600 font-bold">
          Create an account
        </Link>
      </p>
    </div>
  );
}
