import { useEffect, useState } from "react";
import { checkBackend } from "../api";
import { RAGApp } from "./RAGApp";

const Index = () => {
  const [backendOk, setBackendOk] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const check = async () => {
      console.log("🔍 Checking backend health...");
      const ok = await checkBackend();
      console.log("🌐 Backend reachable?", ok);
      setBackendOk(ok);
      setLoading(false);
    };

    check();
  }, []);

  if (loading) return <p>Checking backend...</p>;

  return (
    <div className="p-4">
      {backendOk ? (
        <>
          <RAGApp />
        </>
      ) : (
        <p className="text-red-600 font-semibold">
          Backend Status: ❌ Not reachable. Please start the backend.
        </p>
      )}
    </div>
  );
};

export default Index;
