import path from 'node:path';
import { app, BrowserWindow, dialog, shell } from 'electron';
import { startStaticServer } from './static-server.js';

app.commandLine.appendSwitch('use-mock-keychain');

let mainWindow = null;
let staticServer = null;

const isExternalUrl = (targetUrl, appUrl) => {
    try {
        const parsedTarget = new URL(targetUrl);
        const parsedApp = new URL(appUrl);

        return parsedTarget.origin !== parsedApp.origin;
    } catch {
        return false;
    }
};

const openExternalUrl = async (targetUrl) => {
    try {
        await shell.openExternal(targetUrl);
    } catch (error) {
        console.error('打开外部链接失败:', error);
    }
};

const registerExternalNavigationGuards = (window, appUrl) => {
    window.webContents.setWindowOpenHandler(({ url }) => {
        if (isExternalUrl(url, appUrl)) {
            void openExternalUrl(url);
            return { action: 'deny' };
        }

        return { action: 'allow' };
    });

    window.webContents.on('will-navigate', (event, url) => {
        if (isExternalUrl(url, appUrl)) {
            event.preventDefault();
            void openExternalUrl(url);
        }
    });
};

const createMainWindow = async (appUrl) => {
    const window = new BrowserWindow({
        width: 1440,
        height: 960,
        minWidth: 1200,
        minHeight: 720,
        backgroundColor: '#0b0b0c',
        show: false,
        title: 'ChartDB',
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    registerExternalNavigationGuards(window, appUrl);

    window.once('ready-to-show', () => {
        window.show();
    });

    window.webContents.on(
        'did-fail-load',
        (_event, errorCode, errorDescription) => {
            dialog.showErrorBox(
                'ChartDB 启动失败',
                `桌面应用加载前端页面失败（${errorCode}）：${errorDescription}`
            );
            window.close();
        }
    );

    window.on('closed', () => {
        if (mainWindow === window) {
            mainWindow = null;
        }
    });

    await window.loadURL(appUrl);
    mainWindow = window;
    return window;
};

const getDistDirectory = () => {
    return path.join(app.getAppPath(), 'dist');
};

const showStartupErrorAndQuit = (error) => {
    const message = error instanceof Error ? error.message : '未知错误';
    dialog.showErrorBox('ChartDB 启动失败', message);
    app.quit();
};

app.whenReady().then(async () => {
    try {
        staticServer = await startStaticServer({
            distDir: getDistDirectory(),
        });
        await createMainWindow(staticServer.url);
    } catch (error) {
        showStartupErrorAndQuit(error);
    }

    app.on('activate', async () => {
        if (!mainWindow && staticServer?.url) {
            await createMainWindow(staticServer.url);
        }
    });
});

app.on('window-all-closed', () => {
    if (globalThis.process?.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', async (event) => {
    if (!staticServer) {
        return;
    }

    event.preventDefault();

    try {
        await staticServer.close();
    } catch (error) {
        console.error('关闭桌面静态服务失败:', error);
    } finally {
        staticServer = null;
        app.exit();
    }
});
