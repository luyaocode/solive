export const GameMode = {
    MODE_NONE: 0,
    MODE_SIGNAL: 1,
    MODE_MATCH: 2,
    MODE_ROOM: 3,
    MODE_AI: 4,
}

export const Piece_Type_Black = '●';
export const Piece_Type_White = '○';

export const DeviceType = {
    UNKNOWN: 0,
    MOBILE: 1,
    PC: 2,
}

export const LoginStatus = {
    LOGOUT: 0,
    OK: 1,
    Failed: 2,
}

export const Table_Client_Ips = 'client_ips';
export const Table_System = 'system';
export const Table_Game_Info = 'game_info';
export const Table_Step_Info = 'step_info';

// 表格列配置
export const Config_ClientIpsColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'IP地址', dataIndex: 'ipAddress', key: 'ipAddress' },
    { title: '连接时间', dataIndex: 'connectionTime', key: 'connectionTime' },
    { title: '地理位置', dataIndex: 'location', key: 'location' }
];

export const Config_GameInfoColumns = [
    { title: '游戏ID', dataIndex: 'gameId', key: 'gameId' },
    { title: '房间ID', dataIndex: 'roomId', key: 'roomId' },
    { title: 'Socket1 ID', dataIndex: 'socket1', key: 'socket1' },
    { title: 'Socket2 ID', dataIndex: 'socket2', key: 'socket2' },
    { title: '类型', dataIndex: 'dType', key: 'dType' },
    { title: '规模', dataIndex: 'scale', key: 'scale' },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime' }
];

export const Config_StepInfoColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '游戏ID', dataIndex: 'gameId', key: 'gameId' },
    { title: 'Socket ID', dataIndex: 'socketId', key: 'socketId' },
    { title: 'X坐标', dataIndex: 'x', key: 'x' },
    { title: 'Y坐标', dataIndex: 'y', key: 'y' },
    { title: '当前道具', dataIndex: 'currItem', key: 'currItem' },
    { title: '下一道具', dataIndex: 'nextItem', key: 'nextItem' },
    { title: '当前时间', dataIndex: 'currentTime', key: 'currentTime' }
];

export const root = document.documentElement;
export const _ = require('lodash');

export const Highest_Online_Users_Background = 'linear-gradient(45deg, #ff5722, #e91e63, #9c27b0, #2196f3, #00bcd4, #4CAF50, #8BC34A, #FFC107, #FF5722)';

export const Avatar_Number_X = 16;
export const Avatar_Number_Y = 5;

export const Messages_Max_Send = 1000;  // 消息数量上限
export const Message_Max_Len = 1000;   // 单条消息长度上限
export const Text_Max_Len = 100; // 单条输入框限制
export const Live_Room_ID_Len = 8;      // 直播间号长度
export const Live_Messages_Max_Send = 10000;
export const Live_Message_Max_Len = 50;
export const Meet_Room_ID_Len = 12;     // 会议室号码长度

export const ExitLiveStreamBtnWaitTime = 3000; // 退出直播按钮需要在开启直播后等待3000ms才能被点击

export const View = {
    Menu: 0,
    Table: 1,
    VideoChat: 2,
    Game: 3,
    SFULiveStream:4,
}

export const AudioIcon = '/picture/svg/AudioIcon.svg';
export const AudioIconDisabled = '/picture/svg/AudioIconDisabled.svg';
export const VideoIcon = '/picture/svg/VideoIcon.svg';
export const VideoIconDisabled = '/picture/svg/VideoIconDisabled.svg';
export const NoVideoIcon = '/picture/svg/NoVideo.svg';
export const SpeakerIcon = '/picture/svg/SpeakerIcon.svg';
export const ShareIcon = '/picture/svg/ShareIcon.svg'; // share page
export const ShareScreenIcon = '/picture/svg/ShareScreenIcon.svg';
export const StopShareScreenIcon = '/picture/svg/StopShareScreenIcon.svg';
export const MessageIcon = '/picture/svg/MessageIcon.svg';
export const StatPanelIcon = '/picture/svg/StatPanelIcon.svg';
export const MediaTrackSettingsIcon = '/picture/svg/MediaTrackSettingsIcon.svg';
export const SwitchCameraIcon = '/picture/svg/SwitchCameraIcon.svg';
export const SelectVideoIcon = '/picture/svg/SelectVideoIcon.svg';
export const SmallSpeakerIcon = '/picture/svg/SmallSpeakerIcon.svg';
export const SmallSpeakerSilentIcon = '/picture/svg/SmallSpeakerSilentIcon.svg';
export const MediaCtlMenuIcon = '/picture/svg/MediaCtlMenuIcon.svg';
export const CloseMediaCtlMenuIcon = '/picture/svg/CloseMediaCtlMenuIcon.svg';
export const DragIcon = '/picture/svg/DragIcon.svg';
export const FullScreenIcon = '/picture/svg/FullScreenIcon.svg';
export const FloatButtonIcon = '/picture/svg/FloatButtonIcon.svg';
export const FloatButtonClickedIcon = '/picture/svg/FloatButtonClickedIcon.svg';
export const FloatButtonNotClickedIcon = '/picture/svg/FloatButtonNotClickedIcon.svg';
export const RemoteDesktopIcon = '/picture/svg/RemoteDesktopIcon.svg';
export const FileTransferIcon = '/picture/svg/FileTransferIcon.svg';
export const RefreshLiveStreamIcon = '/picture/svg/RefreshLiveStreamIcon.svg';
export const LiveChatPanelIcon = '/picture/svg/LiveChatPanelIcon.svg';
export const EnterLiveRoomIcon = '/picture/svg/EnterLiveRoomIcon.svg';

export const BGM1 = '/audio/bgm/cruising-down-8bit-lane.mp3';
export const BGM2 = '/audio/bgm/after_the_rain.mp3';

export const PublicMsg_Max_Length = 5000;
export const Notice_Max_Length = 1000;
export const TitleNotice = {
    message: '社会主义核心价值观：富强、民主、文明、和谐；自由、平等、公正、法治；爱国、敬业、诚信、友善。\
    Core values of socialism: Prosperity, democracy, civilization, harmony; freedom, equality, justice, rule of law; patriotism, dedication, integrity, kindness.\
    सोशलिज़म के मूल्यों: समृद्धि, लोकतंत्र, सभ्यता, सामंजस्य; स्वतंत्रता, समानता, न्याय, कानून का शासन; देशभक्ति, समर्पण, ईमानदारी, मित्रता।\
    社会主義の核心価値観: 繁栄、民主主義、文明、調和; 自由、平等、正義、法の支配; 愛国心、献身、誠実、親切。\
    Основные ценности социализма: процветание, демократия, цивилизация, гармония; свобода, равенство, справедливость, верховенство права; патриотизм, преданность, целостность, доброта.\
    Valori fondamentali del socialismo: prosperità, democrazia, civiltà, armonia; libertà, uguaglianza, giustizia, stato di diritto; patriottismo, dedizione, integrità, gentilezza.\
    Valeurs fondamentales du socialisme : prospérité, démocratie, civilisation, harmonie ; liberté, égalité, justice, État de droit ; patriotisme, dévouement, intégrité, gentillesse.\
    Kernwerte des Sozialismus: Wohlstand, Demokratie, Zivilisation, Harmonie; Freiheit, Gleichheit, Gerechtigkeit, Rechtsstaatlichkeit; Patriotismus, Hingabe, Integrität, Freundlichkeit.\
    사회주의의 핵심 가치: 번영, 민주주의, 문명, 조화; 자유, 평등, 정의, 법치; 애국심, 헌신, 정직, 친절.\
    القيم الأساسية للإشتراكية: الازدهار، الديمقراطية، الحضارة، الانسجام؛ الحرية، المساواة، العدالة، سيادة القانون؛ الوطنية، التفاني، النزاهة، اللطف.\
    Βασικές αξίες του σοσιαλισμού: ευημερία, δημοκρατία, πολιτισμός, αρμονία; ελευθερία, ισότητα, δικαιοσύνη, κράτος δικαίου; πατριωτισμός, αφοσίωση, ακεραιότητα, ευγένεια.',
    id: '小棋',
    timestamp: Date.now(),
    locationData: {
        country: '中国',
        region: '湖北',
    }
}

export const FacingMode = {
    Front: 'user',
    Behind: 'environment',
}
export const FrameRate = {
    Min: 30,
    Default: 60,//max=min=60
    Max: 120,
}
export const SampleRate = {
    Min: 8000,
    Default: 48000,
    Max: 51200,
}

export const FrameWidth = {
    Min: 64,
    Default: 640,
    Max: Infinity,
}

export const FrameHeight = {
    Min: 64,
    Default: 480,
    Max: Infinity,
}

export const InitMediaTrackSettings = {
    localVideoWidth: FrameWidth.Default,
    localVideoHeight: FrameHeight.Default,
    localFrameRate: FrameRate.Default,
    facingMode: FacingMode.Front,

    autoGainControl: true,
    echoCancellation: true,
    noiseSuppression: true,
    voiceIsolation: true,
    sampleRate: SampleRate.Default
}

export const GlobalSignal = {
    Active: 'active',
    ReturnMenu: 'return_menu',
    SaveVideoBtnClick: 'save_video_btn_click',
    TranscodeBtnClick: 'transcode_btn_click',
    PreviewVideoBtnClick: 'preview_btn_click',
    TranscodeFinished: 'transcode_finished',
    RecordVideoBtnClicked_OutAudioEnabled: 'record_video_btn_clicked_out_audio_enabled',
    RecordVideoBtnClicked_OutAudioDisabled: 'record_video_btn_clicked_out_audio_disabled',
    StopTranscode: 'stop_transcode',
    SetFloatBallPosition: 'set_float_ball_position',
    StopLive: 'stop_live',
}

/*预留5%底部空白*/
export const Window_Max_Height_Factor = 0.95;

export const WebsiteTitle = {
    Menu: '直播·会议·视频通话',
    Game: '直播·会议·视频通话',
    Table: '直播·会议·视频通话',
    VideoChat: '直播·会议·视频通话',
}

export const SubPage = {
    Gomoku: 'gomoku',
    VideoCall: 'video-call',
    LiveStream: 'live-stream',
    Meet: 'meet-room',
    SFULive:'sfu-live',
}

export const mouseEvents = [
    'mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu',
    'mouseenter', 'mouseleave', 'mouseover', 'mouseout', 'mousemove',
    'wheel'
];

export const Chunk_Max_Size = 50 * 1024;/**单次发送上限50KB */
export const LiveStreamRole = {
    Unknown: 0,
    Anchor: 1,
    Viewer: 2,
}

export const Request_Type = {
    LIANMAI: 'lianmai',
    LIANMAI_EXIT: 'lianmai_exit',
}

