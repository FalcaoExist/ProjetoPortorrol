import { useState, useEffect } from "react";
import logo from "./assets/logo.png";
import iby from "./assets/iby.png";

export default function App() {
  const [isBouncing, setIsBouncing] = useState(true);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const [apiStatus, setApiStatus] = useState({
    loading: true,
    message: "Verificando conexão...",
  });

  useEffect(() => {
    fetch('/api/')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Erro ao conectar: ' + res.status);
        }
        return res.text();
      })
      .then(() => {
        setApiStatus({ loading: false, message: '✅ Front e Back estão integrados!' });
      })
      .catch((err) => {
        console.error('Fetch error connecting to backend:', err);
        setApiStatus({ loading: false, message: '❌ Não conseguiu conectar ao backend: ' + err.message });
      });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBouncing(false);
      setIsTimerFinished(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6 text-center">
      <div className="flex items-center justify-center gap-4">
        <img
          src={logo}
          alt="Logo"
          className={`w-60 h-60 ${isBouncing ? "animate-bounce" : ""}`}
        />
        <img src={iby} alt="IBy" className="h-48" />
      </div>
      <h1 className="text-2xl font-bold text-gray-800">
        {isTimerFinished ? apiStatus.message : "Verificando conexão..."}
      </h1>
    </div>
  );
}