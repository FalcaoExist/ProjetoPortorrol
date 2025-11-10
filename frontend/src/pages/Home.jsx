import { useState, useEffect } from "react";
import iby from "../assets/logoIby_maior.png";

export default function Home() {
  const [isBouncing, setIsBouncing] = useState(true);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const [apiStatus, setApiStatus] = useState({
    loading: true,
    message: "Verificando conexão...",
  });

  useEffect(() => {
    fetch("/")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erro ao conectar: " + res.status);
        }
        return res.text();
      })
      .then(() => {
        setApiStatus({
          loading: false,
          message: "✅ Front e Back estão integrados!",
        });
      })
      .catch((err) => {
        console.error("Fetch error connecting to backend:", err);
        setApiStatus({
          loading: false,
          message:
            "❌ Não conseguiu conectar ao backend: " + err.message,
        });
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
      <img
        src={iby}
        alt="Logo IBy"
        className={`w-56 sm:w-64 h-auto ${
          isBouncing ? "animate-bounce" : ""
        }`}
      />

      <h1 className="text-2xl font-bold text-gray-800">
        Seja bem-vindo!
      </h1>

      <p className="text-lg font-bold text-gray-800">
        {isTimerFinished
          ? apiStatus.message
          : "Verificando conexão..."}
      </p>
    </div>
  );
}
