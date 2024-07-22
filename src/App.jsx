import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChaosGomoku from "./ChaosGomoku";

const App = () => {
    return (
        <Router>
            <Routes>
                {/* call-视频通话-例如/call/123456
                    room-游戏-例如/room/123456
                    live-直播-例如/live/123456
                    meet-会议-例如/meet/123456
                    sfulive-sfu架构直播-例如/sfulive/123456
                 */}
                <Route path="/" element={<ChaosGomoku />} />
                <Route path="/:subpage" element={<ChaosGomoku />} />
                <Route path="/call/:sid" element={<ChaosGomoku />} />
                <Route path="/room/:rid" element={<ChaosGomoku />} />
                <Route path="/live/:lid" element={<ChaosGomoku />} />
                <Route path="/meet/:mid" element={<ChaosGomoku />} />
                <Route path="/sfulive/:sfurid" element={<ChaosGomoku />} />
            </Routes>
        </Router>
    );
};

export default App;