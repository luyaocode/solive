export const GameMode = {
    MODE_NONE: 0,
    MODE_SIGNAL: 1,
    MODE_MATCH: 2,
    MODE_ROOM: 3,
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
    { title: '连接时间', dataIndex: 'connectionTime', key: 'connectionTime' }
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

export const Messages_Max_Len = 1000;