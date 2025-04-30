//frontend/src/routes/index.js
import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Questions from "../pages/Questions";
import AnswersPage from "../pages/Answers";

const router = createBrowserRouter([
    {
        path : '/',
        element : <App/>,
        children : [
            // {
            //     path : 'home',
            //     element:<Home/>
            // },
            {
                path:"login",
                element:<Login/>
            },
            {
                path:"register",
                element:<Signup/>
            },
            {
                path:"Manage-Questions",
                element:<Questions/>
            },
            {
                path:"responses",
                element:<AnswersPage/>
            }
        ]
    }
])

export default router 