import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

const MIME_TYPES = {
    '.css': 'text/css; charset=utf-8',
    '.gif': 'image/gif',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
};

const getRuntimeValue = (name) => {
    const environment = globalThis.process?.env ?? {};
    return environment[name] ?? environment[`VITE_${name}`] ?? '';
};

const createConfigScript = () => {
    const config = {
        OPENAI_API_KEY: getRuntimeValue('OPENAI_API_KEY'),
        OPENAI_API_ENDPOINT: getRuntimeValue('OPENAI_API_ENDPOINT'),
        LLM_MODEL_NAME: getRuntimeValue('LLM_MODEL_NAME'),
        HIDE_CHARTDB_CLOUD: getRuntimeValue('HIDE_CHARTDB_CLOUD'),
        DISABLE_ANALYTICS: getRuntimeValue('DISABLE_ANALYTICS'),
    };

    return `window.env = ${JSON.stringify(config)};`;
};

const sendText = (response, statusCode, contentType, body) => {
    response.writeHead(statusCode, {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
    });
    response.end(body);
};

const isPathInside = (candidatePath, parentPath) => {
    const relativePath = path.relative(parentPath, candidatePath);
    return relativePath === '' || !relativePath.startsWith('..');
};

const resolveRequestPath = (distDir, pathname) => {
    const decodedPath = decodeURIComponent(pathname);
    const normalizedPath = decodedPath === '/' ? '/index.html' : decodedPath;
    const requestedPath = path
        .normalize(normalizedPath)
        .replace(/^(\.\.[/\\])+/, '');
    const absolutePath = path.resolve(distDir, `.${requestedPath}`);

    if (!isPathInside(absolutePath, distDir)) {
        return null;
    }

    return absolutePath;
};

const createRequestListener = (distDir) => {
    return async (request, response) => {
        if (!request.url) {
            sendText(response, 400, 'text/plain; charset=utf-8', 'Bad Request');
            return;
        }

        const requestUrl = new URL(request.url, 'http://127.0.0.1');
        if (requestUrl.pathname === '/config.js') {
            sendText(
                response,
                200,
                'application/javascript; charset=utf-8',
                createConfigScript()
            );
            return;
        }

        const filePath = resolveRequestPath(distDir, requestUrl.pathname);
        if (!filePath) {
            sendText(response, 403, 'text/plain; charset=utf-8', 'Forbidden');
            return;
        }

        try {
            const fileStat = await stat(filePath);
            if (fileStat.isDirectory()) {
                throw new Error('Directory request is not supported');
            }

            response.writeHead(200, {
                'Content-Type':
                    MIME_TYPES[path.extname(filePath).toLowerCase()] ??
                    'application/octet-stream',
                'Cache-Control': 'no-store',
            });

            if (request.method === 'HEAD') {
                response.end();
                return;
            }

            createReadStream(filePath).pipe(response);
            return;
        } catch {
            if (path.extname(requestUrl.pathname)) {
                sendText(
                    response,
                    404,
                    'text/plain; charset=utf-8',
                    'Not Found'
                );
                return;
            }

            const fallbackPath = path.join(distDir, 'index.html');
            if (!existsSync(fallbackPath)) {
                sendText(
                    response,
                    500,
                    'text/plain; charset=utf-8',
                    'Missing dist/index.html. Please run the web build before launching the desktop app.'
                );
                return;
            }

            response.writeHead(200, {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-store',
            });

            if (request.method === 'HEAD') {
                response.end();
                return;
            }

            createReadStream(fallbackPath).pipe(response);
        }
    };
};

export const startStaticServer = async ({ distDir }) => {
    const entryFile = path.join(distDir, 'index.html');
    if (!existsSync(entryFile)) {
        throw new Error(
            `未找到前端构建产物：${entryFile}。请先执行 npm run desktop:build-web。`
        );
    }

    const server = http.createServer(createRequestListener(distDir));

    const FIXED_PORT = 17680;
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(FIXED_PORT, '127.0.0.1', () => {
            server.off('error', reject);
            resolve();
        });
    });

    const address = server.address();
    if (!address || typeof address === 'string') {
        server.close();
        throw new Error('桌面静态服务启动失败，未能获取本地端口。');
    }

    return {
        close: () =>
            new Promise((resolveClose, rejectClose) => {
                server.close((error) => {
                    if (error) {
                        rejectClose(error);
                        return;
                    }
                    resolveClose();
                });
            }),
        port: address.port,
        url: `http://127.0.0.1:${address.port}`,
    };
};
