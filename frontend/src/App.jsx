import AppRouter from "./router/AppRouter";
import { POSProvider } from "./context/POSContext";

export default function App() {
  return (
    <POSProvider>
      <div className="App">
        <AppRouter />
      </div>
    </POSProvider>
  );
}