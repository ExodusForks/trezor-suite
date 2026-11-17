import { BrowserSessionsBackground } from '../src/sessions/background-browser';
import { WebUsbTransport } from '../src/transports/webusb.browser';

jest.mock('../src/sessions/background-browser', () => ({
    BrowserSessionsBackground: jest.fn(() => {
        const { SessionsBackground } = jest.requireActual('../src/sessions/background');

        return new SessionsBackground();
    }),
}));

describe('WebUSB sessions worker', () => {
    const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    const originalFetch = globalThis.fetch;
    const sessionsBackgroundUrl = 'https://example.com/workers/sessions.js';

    beforeEach(() => {
        jest.clearAllMocks();
        Object.defineProperty(globalThis, 'navigator', {
            configurable: true,
            value: { usb: { getDevices: jest.fn().mockResolvedValue([]) } },
        });
        globalThis.fetch = jest.fn();
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        if (originalNavigator) {
            Object.defineProperty(globalThis, 'navigator', originalNavigator);
        } else {
            Reflect.deleteProperty(globalThis, 'navigator');
        }
        globalThis.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    it('uses a worker only when explicitly configured', async () => {
        jest.mocked(globalThis.fetch).mockResolvedValue({ ok: true } as Response);
        const transport = new WebUsbTransport({ id: 'test', messages: {}, sessionsBackgroundUrl });

        await expect(transport.init()).resolves.toMatchObject({ success: true });
        expect(globalThis.fetch).toHaveBeenCalledWith(sessionsBackgroundUrl, { method: 'HEAD' });
        expect(BrowserSessionsBackground).toHaveBeenCalledWith(sessionsBackgroundUrl);
        await transport.stop();
    });

    it.each(['missing', 'rejected'])(
        'keeps local sessions when the worker is %s',
        async failure => {
            if (failure === 'missing') {
                jest.mocked(globalThis.fetch).mockResolvedValue({ ok: false } as Response);
            } else {
                jest.mocked(globalThis.fetch).mockRejectedValue(new Error('Network unavailable'));
            }
            const transport = new WebUsbTransport({
                id: 'test',
                messages: {},
                sessionsBackgroundUrl,
            });

            await expect(transport.init()).resolves.toMatchObject({ success: true });
            await expect(transport.enumerate()).resolves.toMatchObject({
                success: true,
                payload: [],
            });
            expect(BrowserSessionsBackground).not.toHaveBeenCalled();
            await transport.stop();
        },
    );
});
