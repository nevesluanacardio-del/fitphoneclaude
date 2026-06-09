import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { Bercos } from "./pages/Bercos";
import { FilaNavios } from "./pages/FilaNavios";
import { Simulacao } from "./pages/Simulacao";
import { Recomendacao } from "./pages/Recomendacao";
import { Layout } from "./components/Layout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "bercos", Component: Bercos },
      { path: "fila", Component: FilaNavios },
      { path: "simulacao", Component: Simulacao },
      { path: "recomendacao", Component: Recomendacao },
    ],
  },
]);
