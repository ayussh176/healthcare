import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

const SignUp = () => {
  const [username, setUsername] = useState(""); // any input accepted
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [department, setDepartment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { signup } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // No restrictions: proceed regardless of input values
    
    try {
      setIsLoading(true);
      const user = await signup(username, password);

      // Create doctor profile in Firestore
      await setDoc(doc(db, "doctors", user.uid), {
        name: doctorName,
        email: username,
        specialization,
        department,
        doctorId: user.uid,
        createdAt: new Date().toISOString(),
        appointments: 0,
        surgeries: 0,
        meetings: 0
      });
      
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
      navigate("/dashboard");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-md overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-center mb-2">PATIENT KHATA</h1>
          <h2 className="text-xl text-gray-500 text-center mb-8">Sign Up</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium">
                Username (Email)
              </label>
              <input
                id="username"
                type="text"
                placeholder="enter any value"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="doctorName" className="block text-sm font-medium">
                Doctor Name
              </label>
              <input
                id="doctorName"
                type="text"
                placeholder="enter any value"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="specialization" className="block text-sm font-medium">
                Specialization
              </label>
              <input
                id="specialization"
                type="text"
                placeholder="enter any value"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="department" className="block text-sm font-medium">
                Department
              </label>
              <input
                id="department"
                type="text"
                placeholder="enter any value"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">
                Enter Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="enter any value"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="enter any value"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-medical-blue text-white py-2 px-4 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Sign up"}
            </button>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="text-medical-blue hover:underline">
                  Login
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
