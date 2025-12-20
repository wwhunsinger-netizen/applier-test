import { createContext, useContext, useState, ReactNode } from "react";
import { Application, MOCK_APPLICATIONS, MOCK_JOBS, Job } from "./mockData";

interface ApplicationsContextType {
  applications: Application[];
  updateApplicationStatus: (id: string, status: Application["status"]) => void;
  updateQAStatus: (id: string, status: Application["qaStatus"]) => void;
  getJobDetails: (jobId: string) => Job | undefined;
}

const ApplicationsContext = createContext<ApplicationsContextType | undefined>(undefined);

export function ApplicationsProvider({ children }: { children: ReactNode }) {
  const [applications, setApplications] = useState<Application[]>(MOCK_APPLICATIONS);

  const updateApplicationStatus = (id: string, status: Application["status"]) => {
    setApplications(prev => prev.map(app => 
      app.id === id ? { ...app, status } : app
    ));
  };

  const updateQAStatus = (id: string, status: Application["qaStatus"]) => {
    setApplications(prev => prev.map(app => 
      app.id === id ? { ...app, qaStatus: status } : app
    ));
  };

  const getJobDetails = (jobId: string) => {
    return MOCK_JOBS.find(j => j.id === jobId);
  };

  return (
    <ApplicationsContext.Provider value={{ applications, updateApplicationStatus, updateQAStatus, getJobDetails }}>
      {children}
    </ApplicationsContext.Provider>
  );
}

export function useApplications() {
  const context = useContext(ApplicationsContext);
  if (context === undefined) {
    throw new Error("useApplications must be used within a ApplicationsProvider");
  }
  return context;
}