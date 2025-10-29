function App() {
  return (
    <div>
      <h1>Frontend rodando</h1>
      <p>Conversando com o backend {process.env.REACT_APP_API_URL}</p>
    </div>
  );
}

export default App;
