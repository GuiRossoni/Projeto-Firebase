import './App.css';
import { Routes } from "react-router-dom";
import { UserContextProvider } from "./components/UserContext";
import routes from './Routes';

function App() {
  return (
    <UserContextProvider>
      <Routes>
        {routes}
      </Routes>
    </UserContextProvider>
  );
}

export default App;
