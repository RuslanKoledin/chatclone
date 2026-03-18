import React from 'react';
import {Route, Routes} from "react-router-dom";
import Homepage from "./components/Homepage";
import SignIn from "./components/register/SignIn";
import SignUp from "./components/register/SignUp";
import {ThemeProvider} from "./theme/ThemeContext";

function App() {
    return (
        <ThemeProvider>
            <Routes>
                <Route path="/" element={<Homepage/>}/>
                <Route path='/signin' element={<SignIn/>}/>
                <Route path='/signup' element={<SignUp/>}/>
            </Routes>
        </ThemeProvider>
    );
}

export default App;
