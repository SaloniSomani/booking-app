import './App.css'
import {Route, Routes} from 'react-router-dom';
import {UserContextProvider} from "./UserContext";
import IndexPage from './pages/IndexPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from "./pages/ProfilePage.jsx";
import PlacesPage from "./pages/PlacesPage";
import PlacesFormPage from "./pages/PlacesFormPage";
import PlacePage from "./pages/PlacePage";
import Layout from './layout';
import BookingsPage from "./pages/BookingsPage";
import BookingPage from "./pages/BookingPage";

import axios from "axios";
import RegisterPage from './pages/RegisterPage';

axios.defaults.baseURL='http://localhost:4000';
// axios.defaults.baseURL='https://bookitupp.netlify.app';
axios.defaults.withCredentials = true;

function App() {
  return (
    <UserContextProvider>
    <Routes>
      <Route path ="/" element={<Layout />}>
        <Route index element={<IndexPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/account" element={<ProfilePage />} />
        <Route path="/account/places" element={<PlacesPage />} />
        <Route path="/account/places/new" element={<PlacesFormPage />} />
        <Route path="/account/places/:id" element={<PlacesFormPage />} />
        <Route path="/place/:id" element={<PlacePage />} />
        <Route path="/account/bookings" element={<BookingsPage />} />
          <Route path="/account/bookings/:id" element={<BookingPage />} />
      </Route>   
    </Routes>
    </UserContextProvider>

  )
}

export default App
