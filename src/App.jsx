import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChaosGomoku from "./ChaosGomoku";

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<ChaosGomoku />} />
                <Route path="/:subpage" element={<ChaosGomoku />} />
                <Route path="/call/:sid" element={<ChaosGomoku />} />
                <Route path="/room/:rid" element={<ChaosGomoku />} />
            </Routes>
        </Router>
    );
};

export default App;