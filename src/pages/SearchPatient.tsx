import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Bell, UserCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";

const SearchPatient = () => {
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPatientId = searchParams.get("patientId") || "";

  const [patientId, setPatientId] = useState(initialPatientId);
  const [isLoading, setIsLoading] = useState(false);
  const [patient, setPatient] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [updateData, setUpdateData] = useState({});
  const [unsubscribeSnapshot, setUnsubscribeSnapshot] = useState(null);

  const [doctorData, setDoctorData] = useState({
    name: "Loading...",
    specialization: "Loading...",
    department: "Loading...",
    doctorId: "Loading...",
  });

  useEffect(() => {
    const fetchDoctorData = async () => {
      if (!currentUser) return;
      try {
        const docRef = doc(db, "doctors", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDoctorData({ ...docSnap.data() });
        } else {
          toast({ title: "Error", description: "No doctor profile found!", variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to load doctor data", variant: "destructive" });
      }
    };
    fetchDoctorData();
  }, [currentUser]);

  const handleSearch = async () => {
    if (!patientId.trim()) {
      toast({ title: "Error", description: "Please enter a patient ID", variant: "destructive" });
      return;
    }
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to search for patients", variant: "destructive" });
      return;
    }
    try {
      setIsLoading(true);
      const patientsRef = collection(db, "patients");
      const q = query(
        patientsRef,
        where("doctorId", "==", currentUser.uid),
        where("__name__", "==", patientId)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        toast({ title: "Not found", description: "No patient found with that ID", variant: "destructive" });
        setPatient(null);
        if (unsubscribeSnapshot) unsubscribeSnapshot();
        return;
      }
      const docSnap = querySnapshot.docs[0];
      const foundDocId = docSnap.id;
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      const unsub = onSnapshot(doc(db, "patients", foundDocId), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setPatient({ id: foundDocId, ...data });
          if (!editMode) setUpdateData({ ...data });
        } else {
          setPatient(null);
        }
      });
      setUnsubscribeSnapshot(() => unsub);
    } catch (error) {
      toast({ title: "Error", description: "Failed to search for patient", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEditMode = () => {
    setEditMode((prev) => !prev);
    if (editMode && patient) setUpdateData({ ...patient });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdatePatient = async (e) => {
    e.preventDefault();
    if (!patient) return;
    try {
      const patientRef = doc(db, "patients", patient.id);
      await updateDoc(patientRef, {
        ...updateData,
        lastVisitDate: new Date().toISOString(),
      });
      toast({ title: "Success", description: "Patient information updated successfully!" });
      setEditMode(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update patient information", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (initialPatientId) handleSearch();
    return () => { if (unsubscribeSnapshot) unsubscribeSnapshot(); };
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar doctorData={doctorData} onLogout={async () => { await logout(); navigate("/login"); }} />

      <div className="flex-1">
        <header className="bg-medical-blue text-white p-4 flex justify-between items-center">
          <button className="rounded-full bg-white p-2">
            <Bell className="h-6 w-6 text-medical-blue" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <div>{doctorData.name}</div>
              <div className="text-sm">{doctorData.specialization}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
              <UserCircle className="h-8 w-8" />
            </div>
          </div>
        </header>

        <main className="p-6">
          <h1 className="text-2xl font-bold mb-6">Search Patient</h1>
          <div className="mb-6 flex space-x-2">
            <input type="text" placeholder="enter patient ID:" className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100" value={patientId} onChange={(e) => setPatientId(e.target.value)} />
            <Button onClick={handleSearch} disabled={isLoading} className="bg-gray-800 hover:bg-gray-900">
              {isLoading ? "Searching..." : (<><Search className="h-5 w-5 mr-2" />enter</>)}
            </Button>
          </div>

          {patient && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Patient Information</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <tbody>
                    {Object.entries({
                      "Patient ID": patient.id,
                      Name: patient.name,
                      Age: patient.age,
                      "Blood Pressure": patient.bloodPressure,
                      Disease: patient.disease,
                      Prescription: patient.prescription,
                      doctorId: patient.doctorId,
                      createdAt: patient.createdAt,
                      lastVisitDate: new Date(patient.lastVisitDate).toLocaleDateString()
                    }).map(([label, value]) => (
                      <tr className="border-b" key={label}>
                        <td className="py-2 font-medium">{label}</td>
                        <td className="py-2">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={toggleEditMode} className="bg-medical-green text-black hover:bg-green-500">
                  {editMode ? "Cancel Edit" : "Edit Patient Information"}
                </Button>
              </div>

              {editMode && (
                <form onSubmit={handleUpdatePatient} className="mt-6 space-y-4">
                  {[
                    { label: "Name", name: "name" },
                    { label: "Age", name: "age" },
                    { label: "Blood Pressure", name: "bloodPressure" },
                    { label: "Disease", name: "disease" },
                    { label: "Prescription", name: "prescription", type: "textarea" },
                  ].map(({ label, name, type }) => (
                    <div className="space-y-2" key={name}>
                      <label htmlFor={name} className="block text-sm font-medium">{label}</label>
                      {type === "textarea" ? (
                        <textarea id={name} name={name} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md" value={updateData[name] || ""} onChange={handleInputChange} />
                      ) : (
                        <input id={name} name={name} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={updateData[name] || ""} onChange={handleInputChange} />
                      )}
                    </div>
                  ))}
                  <Button type="submit" className="bg-medical-green text-black hover:bg-green-500">Update Patient</Button>
                </form>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SearchPatient;
