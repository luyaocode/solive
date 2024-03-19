import * as process from 'process';

// Left is browser env and right is node env
(window as any).global = window;
(window as any).process = process;
(window as any).Buffer = [];