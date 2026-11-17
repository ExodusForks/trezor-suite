// Loading the explicit browser entry must not require Node-only modules in desktop dev mode.
jest.mock('events', () => {
    throw new Error('Node events is unavailable in the renderer');
});
jest.mock('dgram', () => {
    throw new Error('Node dgram is unavailable in the renderer');
});
jest.mock('@exodus/fetch', () => ({ fetch: jest.fn() }));

import { WRONG_ENVIRONMENT } from '../src/errors';
import {
    AbstractApiTransport,
    BridgeTransport,
    UdpTransport,
    WebUsbTransport,
} from '../src/index.browser';
import { ping } from '../src/pinger/ping.browser';

// Importing the browser entry must not access window before a transport is created.
describe('browser-safe entry', () => {
    const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        Object.defineProperty(globalThis, 'navigator', {
            configurable: true,
            value: { usb: { getDevices: jest.fn().mockResolvedValue([]) } },
        });
        globalThis.fetch = jest.fn();
    });

    afterEach(() => {
        if (originalNavigator) {
            Object.defineProperty(globalThis, 'navigator', originalNavigator);
        } else {
            Reflect.deleteProperty(globalThis, 'navigator');
        }
        globalThis.fetch = originalFetch;
    });

    it('initializes and enumerates with real WebUSB and local sessions', async () => {
        const transport = new WebUsbTransport({ id: 'test', messages: {} });

        expect(transport).toBeInstanceOf(AbstractApiTransport);
        await expect(transport.init()).resolves.toMatchObject({ success: true });
        await expect(transport.enumerate()).resolves.toMatchObject({ success: true, payload: [] });
        expect(globalThis.fetch).not.toHaveBeenCalled();
        await transport.stop();
    });

    it('exports a UDP stub without importing dgram', async () => {
        const transport = new UdpTransport({ id: 'test', messages: {} });

        await expect(transport.init()).resolves.toMatchObject({
            success: false,
            error: WRONG_ENVIRONMENT,
        });
    });

    it('pings Bridge directly without a worker loader', async () => {
        jest.mocked(globalThis.fetch).mockResolvedValue({
            json: () => Promise.resolve({ version: '2.0.33' }),
        } as Response);
        const transport = new BridgeTransport({ id: 'test', messages: {} });

        await expect(transport.ping()).resolves.toBe(true);
        await expect(ping('http://127.0.0.1:21325/')).resolves.toBe(true);
        expect(globalThis.fetch).toHaveBeenCalledWith(
            'http://127.0.0.1:21325/',
            expect.objectContaining({ method: 'POST' }),
        );
    });
});
