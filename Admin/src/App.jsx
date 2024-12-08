import { Route, Routes } from "react-router-dom";
import AddProduct from "./components/AddProduct/AddProduct";
import ListProduct from "./components/ListProduct/ListProduct";
import Home from "./pages/home.route";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin/product/add" element={<AddProduct />} />
      <Route path="/admin/product/list" element={<ListProduct />} />
    </Routes>
  );
};

export default App;
