'use client'
import { useState } from "react"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { auth } from "../../../firebase"
import { useRouter } from "next/navigation"
import { setDoc, doc } from "firebase/firestore";
import { db } from "../../../firebase"

export default function SignUp(){

const [fullName, setFullName] = useState("")
const [email, setEmail] = useState("")
const [password, setPassword] = useState("")
const router = useRouter()

const signUp = async () => {
  try{
    const userData = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(userData.user, {
      displayName : fullName
    })

    await setDoc(doc(db, "users", userData.user.uid),{
      uid: userData.user.uid,
      name: fullName,
      email: email
    })
    
router.push('/Login')

  }
  catch(error:any){
    if(error.code === "auth/email-already-in-use"){
      alert("Already in use, redirecting to login....")
      router.push("/Login")
    } else {
      alert(error.message)
    }

  }
}


    return(
        <div className="bg-lightBg flex flex-col items-center justify-center min-h-screen p-10 gap-4">
      <h1 className="text-black font-poppins font-extrabold text-xl sm:text-2xl">Chattrix</h1>

      <h2 className="font-poppins font-extrabold text-3xl text-center text-darkText sm:text-4xl xl:text-5xl">Create an account</h2>

    <input type="text"
      placeholder="Full Name"
      onChange={(e) => setFullName(e.target.value)}
      className="p-4 border border-grayText w-[250px] h-[40px] sm:w-[300px] sm:h-[40px] rounded-lg focus:outline-none focus:border-2 focus:border-slackBlue"/>
      
      <input type="email"
      placeholder="name@work-email.com"
      onChange={(e) => setEmail(e.target.value)}
      className="p-4 border border-grayText w-[250px] h-[40px] sm:w-[300px] sm:h-[40px] rounded-lg focus:outline-none focus:border-2 focus:border-slackBlue"/>

      <input type="password"
      placeholder="password"
      onChange={(e) => setPassword(e.target.value)}
      className="p-4 border border-grayText w-[250px] h-[40px] sm:w-[300px] sm:h-[40px] rounded-lg focus:outline-none focus:border-2 focus:border-slackBlue"/>

      <button onClick={signUp} className="font-bold text-poppins bg-mainPurple text-white w-[250px] h-[40px] sm:w-[300px] sm:h-[40px] rounded-lg">Sign Up With Email</button>

    </div>
    )
}