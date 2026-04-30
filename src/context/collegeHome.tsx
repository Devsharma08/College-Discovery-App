import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { College } from '../types'
import { API_URL } from '../config'


interface CollegeHomeType {
   loading: boolean;
   setLoading: React.Dispatch<React.SetStateAction<boolean>>;
   colleges: College[];
   setColleges: React.Dispatch<React.SetStateAction<College[]>>;
}

const CollegeHomeContext = createContext<CollegeHomeType | null>(null);

export const useCollegeHome = () => {
   const context = useContext(CollegeHomeContext);
   if (!context) {
      throw Error("useCollegeHome must be used within a HomeContextProvider");
   }
   return context;
};

export const HomeContextProvider = ({ children }: { children: ReactNode }) => {
   const [colleges, setColleges] = useState<College[]>([]);
   const [loading, setLoading] = useState<boolean>(false);

   useEffect(() => {
      const fetchData = async () => {
        
         setLoading(true);
         try {
            const res = await fetch(`${API_URL}/api/colleges?limit=12`, {
               method: "GET",
               headers: {
                  'Content-Type': 'application/json'
               }
            });
            
            if (res.ok) {
               const data = await res.json();
               setColleges(data);
            }
         } catch (error) {
            console.error("API Fetch Error:", error);
         } finally {
            setLoading(false);
         }
      };

      fetchData();
   }, []);

   const value = useMemo(
      () => ({ loading, setColleges, colleges, setLoading }),
      [loading, colleges]
   );

   return (
      <CollegeHomeContext.Provider value={value}>
         {children}
      </CollegeHomeContext.Provider>
   );
}
