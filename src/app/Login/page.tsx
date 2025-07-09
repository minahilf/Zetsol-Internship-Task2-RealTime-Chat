'use client'
import Link from "next/link";
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../firebase";
import Image from "next/image";
import { useRouter } from "next/navigation"; 


export default function Login() {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()


  const Login = async () => {
    setLoading(true)
    try{
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/Chat')
      
    } catch(error:any){
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }


  return (
  <div className="flex flex-col lg:flex-row items-center justify-around min-h-screen bg-lightBg p-10">
    

    <div className="hidden lg:block mt-10">
      <Image src="/illustration.png" alt="Chat Illustration" width={400} height={400} />
    </div>

    {/* Login Form */}
    <div className="flex flex-col items-center gap-4">
      <Image src="/logo.png" alt="Chattrix Logo" width={100} height={100} />
      
      <h1 className="text-black font-poppins font-extrabold text-xl sm:text-2xl -mt-6">
        Chattrix
      </h1>

      <h2 className="font-poppins font-extrabold text-center text-darkText text-2xl sm:text-3xl xl:text-4xl
">
        Enter your email to log in
      </h2>

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
          onClick={Login}
          disabled={loading}
          className="font-bold text-poppins bg-mainPurple text-white lg:w-[200px] w-[180px] text-sm hover:bg-[#6a226b] transition duration-200 h-[40px] sm:h-[40px] rounded-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="border-2 border-white border-t-transparent animate-spin rounded-full w-4 h-4" />
              <span>Logging in...</span>
            </>
          ) : (
            "Log In With Email"
          )}
        </button>

      <p className="text-sm font-poppins font-light mt-4 text-center">
        OR New To Chattrix?{" "}
        <Link href="/Signup" className="text-blue-600 font-bold">
          Create an account
        </Link>
      </p>
    </div>

  </div>
);
}
